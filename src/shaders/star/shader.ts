import vertexSrc from "./vertex.glsl"
import fragmentSrc from './fragment.glsl';
import { LensFlare } from "../lens_flare/shader";
import star from "../../assets/star.png";

export class Star extends LensFlare {
    private static readonly ANIMATION_DURATION = 1000;

    constructor(gl: WebGL2RenderingContext) {
        super(gl, {
            vertexSrc,
            fragmentSrc,
            imageSrc: star,
            animationDuration: Star.ANIMATION_DURATION,
        });
    }
}