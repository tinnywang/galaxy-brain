import fragmentSrc from './fragment.glsl';
import vertexSrc from './vertex.glsl';
import { PostProcessing } from "../post_processing/shader";
import { OcclusionShader } from "../occlusion/shader";
import { Model } from '../../models/model';
import WebGL2 from '../../gl';
import { Light } from '../../light';
import Matrix from '../../matrix';

interface RenderProps {
    models: Model[];
    light: Light;
    samples: number;
    density: number;
    weight: number;
    decay: number;
    exposure: number;
}

export class CrepuscularRay extends PostProcessing<RenderProps> {
    private colorTexture: WebGLTexture;
    private texture: WebGLTexture;
    private occlusion: OcclusionShader;
    private postProcessing: PostProcessing;

    constructor(gl: WebGL2RenderingContext, colorTexture: WebGLTexture) {
        super(gl, vertexSrc, fragmentSrc);

        this.colorTexture = colorTexture;
        this.texture = WebGL2.createColorTextures(gl, 1)[0];
        this.occlusion = new OcclusionShader(gl, 0.5);
        this.postProcessing = new PostProcessing(gl);

        this.locations.setUniform('modelViewMatrix');
        this.locations.setUniform('projectionMatrix');
        this.locations.setUniform('lightPosition');
        this.locations.setUniform('samples');
        this.locations.setUniform('density');
        this.locations.setUniform('weight');
        this.locations.setUniform('alpha');
        this.locations.setUniform('decay');
        this.locations.setUniform('exposure');
        this.locations.setUniform('colorTexture');
    }

    render(timestamp: DOMHighResTimeStamp, drawFramebuffer: WebGLFramebuffer, props: RenderProps) {
        if (props.light.alpha === 0) {
            return;
        }

        // Render occluding objects black and untextured.
        this.occlusion.render(timestamp, drawFramebuffer, {
            models: props.models,
            color: props.light.color,
        });

        // Render crepescular rays from the occluding texture.
        this.gl.useProgram(this.program);

        this.gl.uniformMatrix4fv(this.locations.getUniform('modelViewMatrix'), false, Matrix.modelView());
        this.gl.uniformMatrix4fv(this.locations.getUniform('projectionMatrix'), false, Matrix.projection(this.gl));
        this.gl.uniform1i(this.locations.getUniform('samples'), props.samples);
        this.gl.uniform1f(this.locations.getUniform('density'), props.density);
        this.gl.uniform1f(this.locations.getUniform('weight'), props.weight);
        this.gl.uniform1f(this.locations.getUniform('alpha'), props.light.alpha);
        this.gl.uniform1f(this.locations.getUniform('decay'), props.decay);
        this.gl.uniform1f(this.locations.getUniform('exposure'), props.exposure);

        this.gl.framebufferTexture2D(this.gl.DRAW_FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, this.texture, 0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);

        props.light.positions.forEach((position) => {
            this.gl.uniform3fv(this.locations.getUniform('lightPosition'), position);
            super.render(timestamp, this.occlusion.texture);
        });

        // Alpha-blend the crepuscular rays with the scene.
        this.gl.disable(this.gl.DEPTH_TEST);
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

        this.gl.framebufferTexture2D(this.gl.DRAW_FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, this.colorTexture, 0);
        this.postProcessing.render(timestamp, this.texture);

        this.gl.disable(this.gl.BLEND);
    }
}
