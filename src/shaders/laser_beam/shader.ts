import vertexSrc from "./vertex.glsl"
import fragmentSrc from './fragment.glsl';
import { Shader } from "../shader";
import { LaserBeams } from "../../laser_beams"

export class LaserBeam extends Shader<LaserBeams> {
    constructor(gl: WebGL2RenderingContext) {
        super(gl, vertexSrc, fragmentSrc);

        this.locations.setAttribute('vertexPosition');
        this.locations.setUniform('modelViewMatrix');
        this.locations.setUniform('projectionMatrix');

        this.locations.setUniform('color');
    }

    render(timestamp: DOMHighResTimeStamp, drawFramebuffer: WebGLFramebuffer, lasers: LaserBeams) {
        this.gl.bindFramebuffer(this.gl.DRAW_FRAMEBUFFER, drawFramebuffer);

        super.render(timestamp, drawFramebuffer, lasers);

        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

        lasers.render(this.gl, this.locations);
    }
}
