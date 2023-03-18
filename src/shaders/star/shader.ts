import fragmentSrc from './fragment.glsl';
import { LensFlare } from "../lens_flare/shader";
import star from "../../assets/star.png";

export class Star extends LensFlare {
    constructor(gl: WebGL2RenderingContext) {
        super(gl, {
            fragmentSrc,
            imageSrc: star,
        });
    }
}