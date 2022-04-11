import vertexSrc from './vertex.glsl';
import fragmentSrc from './fragment.glsl';
import { Shader } from '../shader';
import { TextureShader } from '../texture/shader';
import { Renderable } from '../../renderables/renderable';
import WebGL2 from '../../gl';

const NUM_PASSES = 4;

export interface TransparentShaderProps {
    opaque: OpaqueProps;
}

interface OpaqueProps {
    depthTexture: WebGLTexture;
    colorTexture: WebGLTexture;
}

export class TransparentShader extends Shader {
    private props: TransparentShaderProps;

    private textureShader: TextureShader;

    private framebuffer: WebGLFramebuffer | null;
    private depthTextures: Array<WebGLTexture>
    private colorTextures: Array<WebGLTexture>;

    constructor(gl: WebGL2RenderingContext, props: TransparentShaderProps) {
        super(gl, vertexSrc, fragmentSrc);

        this.props = props;

        this.textureShader = new TextureShader(gl);

        this.framebuffer = gl.createFramebuffer();
        this.depthTextures = WebGL2.createDepthTextures(this.gl, 2);
        this.colorTextures = WebGL2.createColorTextures(this.gl, NUM_PASSES);

        this.locations.setAttribute('vertexPosition');
        this.locations.setUniform('modelViewProjectionMatrix');
        this.locations.setUniform('color');
        this.locations.setUniform('opaqueDepthTexture');
        this.locations.setUniform('opaqueColorTexture');
        this.locations.setUniform('peelDepthTexture');
        this.locations.setUniform('shouldDepthPeel');
    }

    render(drawFramebuffer: WebGLFramebuffer, ...renderables: Renderable[]) {
        this.gl.useProgram(this.program);

        // Texture units 0 and 1 are used for the depth peel read/write textures.
        this.gl.activeTexture(this.gl.TEXTURE2);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.props.opaque.depthTexture);
        this.gl.uniform1i(this.locations.getUniform('opaqueDepthTexture'), 2);

        this.gl.activeTexture(this.gl.TEXTURE3);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.props.opaque.colorTexture);
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
        this.gl.framebufferTexture2D(this.gl.DRAW_FRAMEBUFFER,this.gl.DEPTH_ATTACHMENT,this.gl.TEXTURE_2D, this.depthTextures[writeIndex], 0);
        this.gl.framebufferTexture2D(this.gl.DRAW_FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, this.colorTextures[i], 0);

        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        this.gl.disable(this.gl.CULL_FACE);
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.depthFunc(this.gl.LESS)
    }
}
