import fragmentSrc from './fragment.glsl';
import vertexSrc from '../occlusion/vertex.glsl';
import { Shader } from '../shader';
import WebGL2 from '../../gl';
import { Model } from '../../models/model';

export class AlphaMask extends Shader<Model> {
    readonly texture: WebGLTexture;

    private colorTexture: WebGLTexture;

    constructor(gl: WebGL2RenderingContext, colorTexture: WebGLTexture) {
        super(gl, vertexSrc, fragmentSrc);

        this.colorTexture = colorTexture;

        this.texture = WebGL2.createColorTextures(
            gl,
            1,
            gl.drawingBufferWidth,
            gl.drawingBufferHeight,
        )[0];

        this.locations.setAttribute('vertexPosition');
        this.locations.setUniform('modelViewMatrix');
        this.locations.setUniform('projectionMatrix');
        this.locations.setUniform('alpha');
    }

    render(timestamp: DOMHighResTimeStamp, drawFramebuffer: WebGLFramebuffer, ...models: Model[]) {
        super.render(timestamp, drawFramebuffer, ...models);

        this.gl.bindFramebuffer(this.gl.DRAW_FRAMEBUFFER, drawFramebuffer);
        this.gl.framebufferTexture2D(this.gl.DRAW_FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, this.texture, 0);
        this.gl.framebufferTexture2D(this.gl.DRAW_FRAMEBUFFER, this.gl.DEPTH_ATTACHMENT, this.gl.TEXTURE_2D, null, 0);

        this.gl.disable(this.gl.DEPTH_TEST);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);

        models?.forEach((m) => {
            this.gl.uniform1f(this.locations.getUniform('alpha'), m.alpha);
            m.render(this.gl, this.locations)
        });

        this.gl.bindFramebuffer(this.gl.DRAW_FRAMEBUFFER, drawFramebuffer);
        this.gl.framebufferTexture2D(this.gl.DRAW_FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, this.colorTexture, 0);
        this.gl.framebufferTexture2D(this.gl.DRAW_FRAMEBUFFER, this.gl.DEPTH_ATTACHMENT, this.gl.TEXTURE_2D, null, 0);
    }
}
