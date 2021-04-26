import vertexSrc from './vertex.glsl';
import fragmentSrc from './fragment.glsl';
import { Shader } from '../shader';
import { ImageShader } from '../image/shader';
import { Renderable } from '../../renderables/renderable';

const NUM_PASSES = 4;

export class TransparentShader extends Shader {
    private imageShader: ImageShader;

    private framebuffer: WebGLFramebuffer | null;
    private depthTextures: Array<WebGLTexture>
    private colorTextures: Array<WebGLTexture>;

    readonly vertexPosition: number
    readonly modelViewProjectionMatrix: WebGLUniformLocation | null
    readonly color: WebGLUniformLocation | null
    readonly depthTextureLoc: WebGLUniformLocation | null;
    readonly shouldDepthPeel: WebGLUniformLocation | null;

    constructor(gl: WebGL2RenderingContext) {
        super(gl, vertexSrc, fragmentSrc);

        this.imageShader = new ImageShader(gl);

        this.framebuffer = gl.createFramebuffer();
        this.depthTextures = this.createDualDepthTextures();
        this.colorTextures = this.createColorTextures(NUM_PASSES);

        this.vertexPosition = this.gl.getAttribLocation(this.program, 'vertexPosition');
        this.modelViewProjectionMatrix = gl.getUniformLocation(this.program, 'modelViewProjectionMatrix');
        this.color = gl.getUniformLocation(this.program, 'color');

        this.depthTextureLoc = gl.getUniformLocation(this.program, 'depthTexture');
        this.shouldDepthPeel = gl.getUniformLocation(this.program, 'shouldDepthPeel');
    }

    render(r: Renderable) {
        this.gl.useProgram(this.program);

        for (let i = 0; i < NUM_PASSES; i++) {
            this.depthPeel(i);

            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, r.buffer.vertices);
            this.gl.vertexAttribPointer(this.vertexPosition, 3, this.gl.FLOAT, false, 0, 0);
            this.gl.enableVertexAttribArray(this.vertexPosition)

            this.gl.uniformMatrix4fv(this.modelViewProjectionMatrix, false, r.matrix.modelViewProjection);

            let offset = 0;
            this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, r.buffer.faces);
            r.object.faces.forEach((f) => {
                this.gl.uniform3fv(this.color, f.material.diffuse);

                this.gl.drawElements(this.gl.TRIANGLES, f.vertex_indices.length, this.gl.UNSIGNED_SHORT, offset);
                // Offset must be a multiple of 2 since an unsigned short is 2 bytes.
                offset += f.vertex_indices.length * 2;
            })
        }

        // Alpha-blend color buffers back-to-front.
        const fb = this.gl.createFramebuffer();
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, fb);
        // Bind color buffer.
        const colorBuffer = this.gl.createRenderbuffer();
        this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, colorBuffer);
        this.gl.renderbufferStorage(this.gl.RENDERBUFFER, this.gl.RGBA4, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight);
        this.gl.framebufferRenderbuffer(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.RENDERBUFFER, colorBuffer);

        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

        for (let i = NUM_PASSES - 1; i >= 0; i--) {
            this.imageShader.render(this.colorTextures[i]);
        }

        const pixels = new Uint8Array(this.gl.drawingBufferWidth * this.gl.drawingBufferHeight * 4);
        this.gl.readPixels(0, 0, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight, this.gl.RGBA, this.gl.UNSIGNED_BYTE, pixels);

        const texture = this.gl.createTexture();
        if (texture) {
            this.gl.activeTexture(this.gl.TEXTURE0);
            this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
            this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, pixels);

            // Now that we've read pixels from the bound framebuffer, unbind the framebuffer so that we draw to the screen.
            this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
            this.imageShader.render(texture);
        }
    }

    private depthPeel(i: number) {
        const readIndex = i % 2;
        const writeIndex = (i + 1) % 2;

        this.gl.activeTexture(this.gl.TEXTURE0 + readIndex);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.depthTextures[readIndex]);
        this.gl.uniform1i(this.depthTextureLoc, readIndex);

        // No depth peeling on 0th iteration.
        this.gl.uniform1i(this.shouldDepthPeel, i);

        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.framebuffer);
        this.gl.activeTexture(this.gl.TEXTURE0 + writeIndex);
        this.bindDepthTexture(this.depthTextures[writeIndex]);
        this.bindColorTexture(this.colorTextures[i], this.gl.COLOR_ATTACHMENT0);

        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        this.gl.disable(this.gl.CULL_FACE);
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.depthFunc(this.gl.LESS)
    }

    private bindColorTexture(texture: WebGLTexture | null, attachment: number) {
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
        this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, attachment, this.gl.TEXTURE_2D, texture, 0);
    }

    private bindDepthTexture(texture: WebGLTexture | null) {
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
        this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.DEPTH_ATTACHMENT, this.gl.TEXTURE_2D, texture, 0);
    }

    private createColorTextures(n: number): Array<WebGLTexture> {
        return this.createTextures(n, this.gl.TEXTURE0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE);
    }

    private createDualDepthTextures(): Array<WebGLTexture> {
        return this.createTextures(2, this.gl.TEXTURE0, this.gl.DEPTH_COMPONENT24, this.gl.DEPTH_COMPONENT, this.gl.UNSIGNED_INT);
    }

    private createTextures(n: number, target: number, format: number, attachment: number, type: number): Array<WebGLTexture> {
        const textures = new Array<WebGLTexture>();

        for (let i = 0; i < n; i++) {
            const texture = this.gl.createTexture();
            if (texture === null) {
                throw new Error("Unable to create texture.")
            }

            this.gl.activeTexture(target + i);
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
