import vertexSrc from './vertex.glsl';
import fragmentSrc from './fragment.glsl';
import { Shader } from '../shader';
import { TextureShader } from '../texture/shader';
import { Renderable } from '../../renderables/renderable';

const NUM_PASSES = 4;

export interface OpaqueProps {
    depthTexture: WebGLTexture;
    colorTexture: WebGLTexture;
}

export class TransparentShader extends Shader {
    private textureShader: TextureShader;

    private framebuffer: WebGLFramebuffer | null;
    private depthTextures: Array<WebGLTexture>
    private colorTextures: Array<WebGLTexture>;

    constructor(gl: WebGL2RenderingContext) {
        super(gl, vertexSrc, fragmentSrc);

        this.textureShader = new TextureShader(gl);

        this.framebuffer = gl.createFramebuffer();
        this.depthTextures = this.createDualDepthTextures();
        this.colorTextures = this.createColorTextures(NUM_PASSES);

        this.locations.setAttribute('vertexPosition');
        this.locations.setUniform('modelViewProjectionMatrix');
        this.locations.setUniform('color');
        this.locations.setUniform('opaqueDepthTexture');
        this.locations.setUniform('opaqueColorTexture');
        this.locations.setUniform('peelDepthTexture');
        this.locations.setUniform('shouldDepthPeel');
    }

    render(drawFramebuffer: WebGLFramebuffer, opaque: OpaqueProps, ...renderables: Renderable[]) {
        this.gl.useProgram(this.program);

        // Texture units 0 and 1 are used for the depth peel read/write textures.
        this.gl.activeTexture(this.gl.TEXTURE2);
        this.gl.bindTexture(this.gl.TEXTURE_2D, opaque.depthTexture);
        this.gl.uniform1i(this.locations.getUniform('opaqueDepthTexture'), 2);

        this.gl.activeTexture(this.gl.TEXTURE3);
        this.gl.bindTexture(this.gl.TEXTURE_2D, opaque.colorTexture);
        this.gl.uniform1i(this.locations.getUniform('opaqueColorTexture'), 3);

        for (let i = 0; i < NUM_PASSES; i++) {
            this.depthPeel(i);

            renderables.forEach((r) => {
                this.gl.bindBuffer(this.gl.ARRAY_BUFFER, r.buffer.vertices);
                const vertexPosition = this.locations.getAttribute('vertexPosition');
                this.gl.vertexAttribPointer(vertexPosition, 3, this.gl.FLOAT, false, 0, 0);
                this.gl.enableVertexAttribArray(vertexPosition)

                this.gl.uniformMatrix4fv(this.locations.getUniform('modelViewProjectionMatrix'), false, r.matrix.modelViewProjection);

                let offset = 0;
                this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, r.buffer.faces);
                r.object.faces.forEach((f) => {
                    this.gl.uniform3fv(this.locations.getUniform('color'), f.material.diffuse);

                    this.gl.drawElements(this.gl.TRIANGLES, f.vertex_indices.length, this.gl.UNSIGNED_SHORT, offset);
                    // Offset must be a multiple of 2 since an unsigned short is 2 bytes.
                    offset += f.vertex_indices.length * 2;
                })
            });
        }

        // Alpha-blend color buffers back-to-front.
        this.gl.bindFramebuffer(this.gl.READ_FRAMEBUFFER, this.framebuffer);
        this.gl.bindFramebuffer(this.gl.DRAW_FRAMEBUFFER, drawFramebuffer);

        this.gl.disable(this.gl.DEPTH_TEST);
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

        for (let i = NUM_PASSES - 1; i >= 0; i--) {
            this.textureShader.render(this.colorTextures[i]);
        }
    }

    private depthPeel(i: number) {
        const readIndex = i % 2;
        const writeIndex = (i + 1) % 2;

        this.gl.activeTexture(this.gl.TEXTURE0 + readIndex);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.depthTextures[readIndex]);
        this.gl.uniform1i(this.locations.getUniform('peelDepthTexture'), readIndex);

        // No depth peeling on 0th iteration.
        this.gl.uniform1i(this.locations.getUniform('shouldDepthPeel'), i);

        this.gl.bindFramebuffer(this.gl.DRAW_FRAMEBUFFER, this.framebuffer);
        this.gl.activeTexture(this.gl.TEXTURE0 + writeIndex);
        this.bindTexture(this.depthTextures[writeIndex], this.gl.DEPTH_ATTACHMENT);
        this.bindTexture(this.colorTextures[i], this.gl.COLOR_ATTACHMENT0);

        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        this.gl.disable(this.gl.CULL_FACE);
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.depthFunc(this.gl.LESS)
    }

    private bindTexture(texture: WebGLTexture | null, attachment: number) {
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
        this.gl.framebufferTexture2D(this.gl.DRAW_FRAMEBUFFER, attachment, this.gl.TEXTURE_2D, texture, 0);
    }

    private createColorTextures(n: number): Array<WebGLTexture> {
        return this.createTextures(n, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE);
    }

    private createDualDepthTextures(): Array<WebGLTexture> {
        return this.createTextures(2, this.gl.DEPTH_COMPONENT24, this.gl.DEPTH_COMPONENT, this.gl.UNSIGNED_INT);
    }

    private createTextures(n: number, format: number, attachment: number, type: number): Array<WebGLTexture> {
        const textures = new Array<WebGLTexture>();

        for (let i = 0; i < n; i++) {
            const texture = this.gl.createTexture();
            if (texture === null) {
                throw new Error("Unable to create texture.")
            }

            this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
            this.gl.texImage2D(this.gl.TEXTURE_2D, 0, format, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight, 0, attachment, type, null);

            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_COMPARE_MODE, this.gl.NONE);

            textures.push(texture);
        }

        return textures;
    }
}
