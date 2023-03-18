import fragmentSrc from './fragment.glsl';
import { LensFlare } from "../lens_flare/shader";
import glow from "../../assets/glow.png";

export class Glow extends LensFlare {
    constructor(gl: WebGL2RenderingContext) {
        super(gl, {
            fragmentSrc,
            imageSrc: glow,
        });
    }
}