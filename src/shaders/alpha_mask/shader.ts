import fragmentSrc from './fragment.glsl';
import vertexSrc from '../occlusion/vertex.glsl';
import { Shader } from '../shader';
import WebGL2 from '../../gl';
import { Model } from '../../models/model';
import { FXAA } from '../fxaa/shader';

export class AlphaMask extends Shader<Model> {
    readonly texture: WebGLTexture;

    private alphaTexture: WebGLTexture;
    private colorTexture: WebGLTexture;
    private fxaa: FXAA;
    private scale = 0.5;

    constructor(gl: WebGL2RenderingContext, colorTexture: WebGLTexture) {
        super(gl, vertexSrc, fragmentSrc);

        this.colorTexture = colorTexture;

        [this.texture, this.alphaTexture] = WebGL2.createColorTextures(
            gl,
            2,
            gl.drawingBufferWidth * this.scale,
            gl.drawingBufferHeight * this.scale,
        );

        this.fxaa = new FXAA(gl);

        this.locations.setAttribute('vertexPosition');
        this.locations.setUniform('modelViewMatrix');
        this.locations.setUniform('projectionMatrix');
        this.locations.setUniform('alpha');
    }

    render(timestamp: DOMHighResTimeStamp, drawFramebuffer: WebGLFramebuffer, ...models: Model[]) {
        super.render(timestamp, drawFramebuffer, ...models);

        this.gl.bindFramebuffer(this.gl.DRAW_FRAMEBUFFER, drawFramebuffer);
        this.gl.framebufferTexture2D(this.gl.DRAW_FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, this.alphaTexture, 0);
        this.gl.framebufferTexture2D(this.gl.DRAW_FRAMEBUFFER, this.gl.DEPTH_ATTACHMENT, this.gl.TEXTURE_2D, null, 0);

        const [x, y, width, height] = this.gl.getParameter(this.gl.VIEWPORT);
        this.gl.viewport(
            x * this.scale,
            y * this.scale,
            width * this.scale,
            height * this.scale,
        );

        this.gl.disable(this.gl.DEPTH_TEST);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);

        models?.forEach((m) => {
            this.gl.uniform1f(this.locations.getUniform('alpha'), m.alpha);
            m.render(this.gl, this.locations)
        });

        this.gl.bindFramebuffer(this.gl.DRAW_FRAMEBUFFER, drawFramebuffer);
        this.gl.framebufferTexture2D(this.gl.DRAW_FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, this.texture, 0);
        this.gl.framebufferTexture2D(this.gl.DRAW_FRAMEBUFFER, this.gl.DEPTH_ATTACHMENT, this.gl.TEXTURE_2D, null, 0);

        this.fxaa.render(timestamp, this.alphaTexture);

        this.gl.viewport(x, y, width, height);

        this.gl.bindFramebuffer(this.gl.DRAW_FRAMEBUFFER, drawFramebuffer);
        this.gl.framebufferTexture2D(this.gl.DRAW_FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, this.colorTexture, 0);
        this.gl.framebufferTexture2D(this.gl.DRAW_FRAMEBUFFER, this.gl.DEPTH_ATTACHMENT, this.gl.TEXTURE_2D, null, 0);
    }
}
