import vertexSrc from './vertex.glsl';
import fragmentSrc from './fragment.glsl';
import { Shader } from '../shader';
import { FlatShader } from '../flat/shader';
import { ImageShader } from '../image/shader';
import { Renderable } from '../../renderable';

const NUM_PASSES = 4;

export class TransparentShader extends Shader {
    private flatShader: FlatShader;
    private imageShader: ImageShader;

    private framebuffer: WebGLFramebuffer | null;
    private depthTextures: Array<WebGLTexture>
    private colorbuffers: Array<WebGLRenderbuffer>;

    constructor(gl: WebGL2RenderingContext) {
        super(gl, vertexSrc, fragmentSrc);

        this.flatShader = new FlatShader(gl);
        this.imageShader = new ImageShader(gl);

        this.framebuffer = gl.createFramebuffer();
        this.depthTextures = this.createDepthTextures(NUM_PASSES);
        this.colorbuffers = this.createRenderbuffers(NUM_PASSES, this.gl.RGBA4);
    }

    render(r: Renderable) {
        this.gl.useProgram(this.program);

        for (let i = 0; i < NUM_PASSES; i++) {
            this.gl.clear(this.gl.COLOR_BUFFER_BIT);
            this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.framebuffer);

            // depth unit 0
            this.bindDepthTexture(this.depthTextures[i%2]);
            if (i === 0) {
                this.gl.disable(this.gl.DEPTH_TEST);
            } else {
                this.gl.enable(this.gl.DEPTH_TEST);
            }
            this.gl.depthMask(false);
            this.gl.depthFunc(this.gl.GREATER);

            // depth unit 1
            this.bindDepthTexture(this.depthTextures[(i+1)%2]);
            this.bindRenderbuffer(this.colorbuffers[i], this.gl.COLOR_ATTACHMENT0);

            this.gl.clear(this.gl.DEPTH_BUFFER_BIT);

            this.gl.depthMask(true);
            this.gl.enable(this.gl.DEPTH_TEST)
            this.gl.depthFunc(this.gl.LESS);

            this.flatShader.render(r);
        }

        const pixels = new Uint8Array(this.gl.drawingBufferWidth * this.gl.drawingBufferHeight * 4);
        this.gl.readPixels(0, 0, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight, this.gl.RGBA, this.gl.UNSIGNED_BYTE, pixels);

        // Now that we've read pixels from the bound framebuffer, unbind the framebuffer so that we draw to the screen.
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
        this.imageShader.render(pixels);
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

    private createDepthTextures(n: number): Array<WebGLTexture> {
        const textures = new Array<WebGLTexture>();

        for (let i = 0; i < n; i++) {
            const texture = this.gl.createTexture();
            if (texture === null) {
                throw new Error("Unable to create texture.")
            }

            this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
            this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.DEPTH_COMPONENT16, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight, 0, this.gl.DEPTH_COMPONENT, this.gl.UNSIGNED_SHORT, null);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);

            textures.push(texture);
        }

        return textures;
    }
}
