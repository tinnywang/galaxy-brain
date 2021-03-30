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
    private colorbuffers: Array<WebGLRenderbuffer>;

    // TODO: encapuslate GLSL variables in interface?
    readonly vertexPosition: number
    readonly modelViewProjectionMatrix: WebGLUniformLocation | null
    readonly color: WebGLUniformLocation | null
    readonly depthTextureLoc: WebGLUniformLocation | null;
    readonly shouldDepthPeel: WebGLUniformLocation | null;
    readonly widthLoc: WebGLUniformLocation | null;
    readonly heightLoc: WebGLUniformLocation | null;
    readonly nearLoc: WebGLUniformLocation | null;
    readonly farLoc: WebGLUniformLocation | null;


    constructor(gl: WebGL2RenderingContext) {
        super(gl, vertexSrc, fragmentSrc);

        this.imageShader = new ImageShader(gl);

        this.framebuffer = gl.createFramebuffer();
        this.depthTextures = this.createDepthTextures();
        this.colorbuffers = this.createRenderbuffers(NUM_PASSES, this.gl.RGBA4);

        this.vertexPosition = this.gl.getAttribLocation(this.program, 'vertexPosition');
        this.modelViewProjectionMatrix = gl.getUniformLocation(this.program, 'modelViewProjectionMatrix');
        this.color = gl.getUniformLocation(this.program, 'color');

        this.depthTextureLoc = gl.getUniformLocation(this.program, 'depthTexture');
        this.shouldDepthPeel = gl.getUniformLocation(this.program, 'shouldDepthPeel');
        this.widthLoc = gl.getUniformLocation(this.program, 'width');
        this.heightLoc = gl.getUniformLocation(this.program, 'height');
        this.nearLoc = gl.getUniformLocation(this.program, 'near');
        this.farLoc = gl.getUniformLocation(this.program, 'far');
    }

    render(r: Renderable) {
        for (let i = 0; i < NUM_PASSES; i++) {
            this.gl.clear(this.gl.COLOR_BUFFER_BIT);
            this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.framebuffer);

            const readIndex = i % 2;
            const writeIndex = (i+1) % 2;

            // depth unit 0
            this.gl.useProgram(this.program);
            this.bindDepthTexture(this.depthTextures[readIndex]);
            this.gl.uniform1i(this.depthTextureLoc, 0);

            this.gl.activeTexture(this.gl.TEXTURE0 + readIndex);
            this.gl.bindTexture(this.gl.TEXTURE_2D, this.depthTextures[readIndex]);
            this.gl.uniform1i(this.depthTextureLoc, readIndex);

            // No depth peeling on 0th iteration.
            this.gl.uniform1i(this.shouldDepthPeel, i);
            this.gl.uniform1f(this.widthLoc, this.gl.drawingBufferWidth);
            this.gl.uniform1f(this.heightLoc, this.gl.drawingBufferHeight);

            // depth unit 1
            this.bindDepthTexture(this.depthTextures[writeIndex]);
            this.bindRenderbuffer(this.colorbuffers[i], this.gl.COLOR_ATTACHMENT0);

            this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
            this.gl.enable(this.gl.DEPTH_TEST);
            this.gl.disable(this.gl.CULL_FACE);
            this.gl.depthMask(true);
            this.gl.enable(this.gl.DEPTH_TEST)
            this.gl.depthFunc(this.gl.LESS);

            this.draw(r);
        }

        // TODO: remove this line and alpha blend color buffers into final image.
        this.bindRenderbuffer(this.colorbuffers[3], this.gl.COLOR_ATTACHMENT0);

        const pixels = new Uint8Array(this.gl.drawingBufferWidth * this.gl.drawingBufferHeight * 4);
        this.gl.readPixels(0, 0, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight, this.gl.RGBA, this.gl.UNSIGNED_BYTE, pixels);

        // Now that we've read pixels from the bound framebuffer, unbind the framebuffer so that we draw to the screen.
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
        this.imageShader.render(pixels);
    }

    private draw(r: Renderable) {
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

    private bindRenderbuffer(rb: WebGLRenderbuffer, attachment: number) {
        this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, rb);
        this.gl.framebufferRenderbuffer(this.gl.FRAMEBUFFER, attachment, this.gl.RENDERBUFFER, rb);
    }

    private bindDepthTexture(texture: WebGLTexture) {
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
        this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.DEPTH_ATTACHMENT, this.gl.TEXTURE_2D, texture, 0);
    }

    private createRenderbuffers(n: number, type: number): Array<WebGLRenderbuffer> {
        const buffers = new Array<WebGLRenderbuffer>();

        for (let i = 0; i < n; i ++) {
            const rb = this.gl.createRenderbuffer();
            if (rb === null) {
                throw new Error("Unable to create render buffer.")
            }

            this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, rb);
            this.gl.renderbufferStorage(this.gl.RENDERBUFFER, type, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight);

            buffers.push(rb);
        }

        return buffers;
    }

    private createDepthTextures(): Array<WebGLTexture> {
        const textures = new Array<WebGLTexture>();

        for (let i = 0; i < 2; i++) {
            const texture = this.gl.createTexture();
            if (texture === null) {
                throw new Error("Unable to create texture.")
            }

            this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
            this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.DEPTH_COMPONENT24, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight, 0, this.gl.DEPTH_COMPONENT, this.gl.UNSIGNED_INT, null);

            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_COMPARE_MODE, this.gl.NONE);

            textures.push(texture);
        }

        return textures;
    }
}
