import fragmentSrc from './fragment.glsl';
import { LensFlare } from "../lens_flare/shader";
import glow from "../../assets/glow.png";

export class Glow extends LensFlare {
    private static readonly ANIMATION_DURATION = 2500;

    constructor(gl: WebGL2RenderingContext) {
        super(gl, {
            fragmentSrc,
            imageSrc: glow,
            animationDuration: Glow.ANIMATION_DURATION,
        });
    }
}