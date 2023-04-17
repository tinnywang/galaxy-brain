import vertexSrc from "./vertex.glsl"
import fragmentSrc from './fragment.glsl';
import { LightBeams } from '../../light_beams';
import { Shader } from '../shader';

export class SpotLight extends Shader<LightBeams> {

    constructor(gl: WebGL2RenderingContext) {
        super(gl, vertexSrc, fragmentSrc);

        this.locations.setAttribute('vertexPosition');
        this.locations.setUniform('modelViewMatrix');
        this.locations.setUniform('projectionMatrix');

        this.locations.setUniform('width');
        this.locations.setUniform('color');
    }

    render(timestamp: DOMHighResTimeStamp, drawFramebuffer: WebGLFramebuffer, ...lights: LightBeams[]) {
        this.gl.bindFramebuffer(this.gl.DRAW_FRAMEBUFFER, drawFramebuffer);

        super.render(timestamp, drawFramebuffer, ...lights);

        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

        lights?.forEach((l) => l.render(this.gl, this.locations));
    }
}
