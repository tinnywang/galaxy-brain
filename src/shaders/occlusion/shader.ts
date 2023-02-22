import fragmentSrc from './fragment.glsl';
import vertexSrc from './vertex.glsl';
import { Shader } from '../shader';
import WebGL2 from '../../gl';
import { vec3 } from 'gl-matrix';
import { Model } from '../../models/model';

export interface OcclusionProps {
    scale: number;
}

export class OcclusionShader extends Shader<Model> {
    private static Black = vec3.fromValues(0, 0, 0);

    private props: OcclusionProps;

    readonly texture: WebGLTexture;

    constructor(gl: WebGL2RenderingContext, props: OcclusionProps) {
        super(gl, vertexSrc, fragmentSrc);

        this.props = props;

        this.texture = WebGL2.createColorTextures(
            gl,
            1,
            gl.drawingBufferWidth * props.scale,
            gl.drawingBufferHeight * props.scale,
        )[0];

        this.locations.setAttribute('vertexPosition');
        this.locations.setUniform('modelViewMatrix');
        this.locations.setUniform('projectionMatrix');
        this.locations.setUniform('color');
    }

    render(drawFramebuffer: WebGLFramebuffer, ...models: Model[]) {
        super.render(drawFramebuffer, ...models);

        this.gl.bindFramebuffer(this.gl.DRAW_FRAMEBUFFER, drawFramebuffer);
        this.gl.framebufferTexture2D(this.gl.DRAW_FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, this.texture, 0);
        this.gl.framebufferTexture2D(this.gl.DRAW_FRAMEBUFFER, this.gl.DEPTH_ATTACHMENT, this.gl.TEXTURE_2D, null, 0);

        const [x, y, width, height] = this.gl.getParameter(this.gl.VIEWPORT);
        this.gl.viewport(
            x * this.props.scale,
            y * this.props.scale,
            width * this.props.scale,
            height * this.props.scale,
        );
        this.gl.disable(this.gl.DEPTH_TEST);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);

        this.gl.uniform3fv(this.locations.getUniform('color'), OcclusionShader.Black);
        models?.forEach((m) => m.render(this.gl, this.locations));

        this.gl.viewport(x, y, width, height);
    }
}
