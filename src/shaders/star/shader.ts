import vertexSrc from "./vertex.glsl"
import fragmentSrc from './fragment.glsl';
import { LensFlare } from "../lens_flare/shader";
import star from "../../assets/textures/star.png";
import { Light } from "../../light";

export class Star extends LensFlare {
    private static readonly ANIMATION_DURATION = 1000;
    private static readonly ROTATION_DURATION = 60000;

    constructor(gl: WebGL2RenderingContext) {
        super(gl, {
            vertexSrc,
            fragmentSrc,
            imageSrc: star,
            animationDuration: Star.ANIMATION_DURATION,
        });

        this.locations.setUniform('rotationDuration');
    }

    render(timestamp: DOMHighResTimeStamp, drawFramebuffer: WebGLFramebuffer, ...lights: Light[]) {
        this.gl.useProgram(this.program);

        this.gl.uniform1f(this.locations.getUniform('rotationDuration'), Star.ROTATION_DURATION);

        super.render(timestamp, drawFramebuffer, ...lights);
    }
}