import fragmentSrc from './fragment.glsl';
import vertexSrc from './vertex.glsl';
import { Light } from '../../light';
import { Shader } from '../shader';

export class Glow extends Shader<Light> {

    constructor(gl: WebGL2RenderingContext) {
        super(gl, vertexSrc, fragmentSrc);

        this.locations.setAttribute('vertexPosition');
        this.locations.setUniform('modelViewMatrix');
        this.locations.setUniform('projectionMatrix');

        this.locations.setUniform('radius');
        this.locations.setUniform('color');
    }

    render(drawFramebuffer: WebGLFramebuffer, ...lights: Light[]) {
        super.render(drawFramebuffer, ...lights);

        this.gl.bindFramebuffer(this.gl.DRAW_FRAMEBUFFER, drawFramebuffer);

        lights?.forEach((l) => l.render(this.gl, this.locations));
    }
}