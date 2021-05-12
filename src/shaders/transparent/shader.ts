import vertexSrc from './vertex.glsl';
import fragmentSrc from './fragment.glsl';
import { Shader } from '../shader';
import { ImageShader } from '../image/shader';
import { Renderable } from '../../renderables/renderable';

const NUM_PASSES = 4;

export class TransparentShader extends Shader {
    private imageShader: ImageShader;

    private framebuffer: WebGLFramebuffer | null;
    private msaaFramebuffer: WebGLFramebuffer | null;
    private depthTextures: Array<WebGLTexture>
    private colorTextures: Array<WebGLTexture>;
    private depthBuffers: Array<WebGLRenderbuffer>;
    private colorBuffers: Array<WebGLRenderbuffer>;

    readonly vertexPosition: number
    readonly modelViewProjectionMatrix: WebGLUniformLocation | null
    readonly color: WebGLUniformLocation | null
    readonly depthTextureLoc: WebGLUniformLocation | null;
    readonly shouldDepthPeel: WebGLUniformLocation | null;

    constructor(gl: WebGL2RenderingContext) {
        super(gl, vertexSrc, fragmentSrc);

        this.imageShader = new ImageShader(gl);

        this.framebuffer = gl.createFramebuffer();
        this.depthBuffers = this.createBuffers(2, this.gl.DEPTH_COMPONENT24);
        this.colorBuffers = this.createBuffers(NUM_PASSES, this.gl.RGBA8);

        this.msaaFramebuffer = gl.createFramebuffer();
        this.colorTextures = this.createColorTextures(NUM_PASSES);
        this.depthTextures = this.createDualDepthTextures();

        this.vertexPosition = this.gl.getAttribLocation(this.program, 'vertexPosition');
        this.modelViewProjectionMatrix = gl.getUniformLocation(this.program, 'modelViewProjectionMatrix');
        this.color = gl.getUniformLocation(this.program, 'color');

        this.depthTextureLoc = gl.getUniformLocation(this.program, 'depthTexture');
        this.shouldDepthPeel = gl.getUniformLocation(this.program, 'shouldDepthPeel');
    }

    render(r: Renderable) {
        this.gl.useProgram(this.program);

        for (let i = 0; i < NUM_PASSES; i++) {
            this.depthPeel(i, () => {
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
            });
        }

        this.gl.bindFramebuffer(this.gl.DRAW_FRAMEBUFFER, this.framebuffer);

        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        this.gl.disable(this.gl.DEPTH_TEST);
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

        for (let i = NUM_PASSES - 1; i >= 0; i--) {
            this.imageShader.render(this.colorTextures[i]);
        }

        this.gl.bindFramebuffer(this.gl.READ_FRAMEBUFFER, this.framebuffer);

        this.gl.bindFramebuffer(this.gl.DRAW_FRAMEBUFFER, null);
        this.gl.blitFramebuffer(
            0, 0, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight,
            0, 0, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight,
            this.gl.COLOR_BUFFER_BIT, this.gl.NEAREST
        );
    }

    private depthPeel(i: number, render: () => void) {
        const readIndex = i % 2;
        const writeIndex = (i + 1) % 2;

        this.gl.activeTexture(this.gl.TEXTURE0 + readIndex);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.depthTextures[readIndex]);
        this.gl.uniform1i(this.depthTextureLoc, readIndex);

        // No depth peeling on 0th iteration.
        this.gl.uniform1i(this.shouldDepthPeel, i);

        this.gl.bindFramebuffer(this.gl.DRAW_FRAMEBUFFER, this.framebuffer);
        this.bindDepthBuffer(this.depthBuffers[writeIndex]);
        this.bindColorBuffer(this.colorBuffers[i], this.gl.COLOR_ATTACHMENT0);

        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        this.gl.disable(this.gl.CULL_FACE);
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.depthFunc(this.gl.LESS)

        render();

        // Blit renderbuffers to textures for MSAA textures.
        this.gl.bindFramebuffer(this.gl.READ_FRAMEBUFFER, this.framebuffer);
        this.gl.bindFramebuffer(this.gl.DRAW_FRAMEBUFFER, this.msaaFramebuffer);
        this.gl.activeTexture(this.gl.TEXTURE0 + writeIndex);
        this.bindDepthTexture(this.depthTextures[writeIndex]);
        this.bindColorTexture(this.colorTextures[i], this.gl.COLOR_ATTACHMENT0);

        this.gl.blitFramebuffer(
            0, 0, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight,
            0, 0, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight,
            this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT, this.gl.NEAREST
        );
    }

    private bindColorTexture(texture: WebGLTexture | null, attachment: number) {
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
        this.gl.framebufferTexture2D(this.gl.DRAW_FRAMEBUFFER, attachment, this.gl.TEXTURE_2D, texture, 0);
    }

    private bindColorBuffer(buffer: WebGLRenderbuffer, attachment: number, target?: number) {
        this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, buffer);
        this.gl.framebufferRenderbuffer(target ?? this.gl.DRAW_FRAMEBUFFER, attachment, this.gl.RENDERBUFFER, buffer);
    }

    private bindDepthBuffer(buffer: WebGLRenderbuffer, target?: number) {
        this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, buffer);
        this.gl.framebufferRenderbuffer(target ?? this.gl.DRAW_FRAMEBUFFER, this.gl.DEPTH_ATTACHMENT, this.gl.RENDERBUFFER, buffer);
    }

    private bindDepthTexture(texture: WebGLTexture | null) {
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
        this.gl.framebufferTexture2D(this.gl.DRAW_FRAMEBUFFER, this.gl.DEPTH_ATTACHMENT, this.gl.TEXTURE_2D, texture, 0);
    }

    private createBuffers(n: number, internalFormat: number): Array<WebGLRenderbuffer> {
        const buffers = new Array<WebGLRenderbuffer>();

        for (let i = 0; i < n; i++) {
            const buffer = this.gl.createRenderbuffer();
            if (buffer === null) {
                throw new Error("Unable to create renderbuffer.")
            }
            this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, buffer);
            this.gl.renderbufferStorageMultisample(this.gl.RENDERBUFFER, this.gl.getParameter(this.gl.MAX_SAMPLES), internalFormat, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight);

            buffers.push(buffer);
        }

        return buffers;
    }

    private createColorTextures(n: number): Array<WebGLTexture> {
        return this.createTextures(n, this.gl.TEXTURE2, this.gl.RGBA8, this.gl.RGBA, this.gl.UNSIGNED_BYTE);
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
