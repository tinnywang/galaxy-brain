import fragmentSrc from './fragment.glsl';
import vertexSrc from './vertex.glsl';
import { Shader } from '../shader';
import WebGL2 from '../../gl';
import { vec3 } from 'gl-matrix';
import { Model } from '../../models/model';

interface RenderProps {
    models: Model[];
    color: vec3;
}

export class OcclusionShader extends Shader<RenderProps> {
    private readonly scale: number;

    readonly texture: WebGLTexture;

    constructor(gl: WebGL2RenderingContext, scale: number) {
        super(gl, vertexSrc, fragmentSrc);

        this.scale = scale;

        this.texture = WebGL2.createColorTextures(
            gl,
            1,
            gl.drawingBufferWidth * scale,
            gl.drawingBufferHeight * scale,
        )[0];

        this.locations.setAttribute('vertexPosition');
        this.locations.setUniform('modelViewMatrix');
        this.locations.setUniform('projectionMatrix');
        this.locations.setUniform('color');
    }

    render(timestamp: DOMHighResTimeStamp, drawFramebuffer: WebGLFramebuffer, props: RenderProps) {
        super.render(timestamp, drawFramebuffer, props);

        this.gl.bindFramebuffer(this.gl.DRAW_FRAMEBUFFER, drawFramebuffer);
        this.gl.framebufferTexture2D(this.gl.DRAW_FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, this.texture, 0);
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

        // Render occluding objects.
        props.models?.forEach((m) => {
            this.gl.uniform4fv(this.locations.getUniform('color'), [...props.color, m.alpha]);
            m.render(this.gl, this.locations)
        });

        this.gl.viewport(x, y, width, height);
    }
}
