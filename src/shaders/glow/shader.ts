import fragmentSrc from './fragment.glsl';
import vertexSrc from './vertex.glsl';
import { Light } from '../../light';
import { Shader } from '../shader';
import { vec2 } from 'gl-matrix';

export class Glow extends Shader<Light> {

    constructor(gl: WebGL2RenderingContext) {
        super(gl, vertexSrc, fragmentSrc);

        this.locations.setAttribute('vertexPosition');
        this.locations.setUniform('modelViewMatrix');
        this.locations.setUniform('projectionMatrix');
        this.locations.setUniform('resolution');

        this.locations.setUniform('radius');
        this.locations.setUniform('color');
    }

    render(drawFramebuffer: WebGLFramebuffer, ...lights: Light[]) {
        super.render(drawFramebuffer, ...lights);

        this.gl.bindFramebuffer(this.gl.DRAW_FRAMEBUFFER, drawFramebuffer);

        const resolution = vec2.fromValues(this.gl.drawingBufferWidth, this.gl.drawingBufferHeight);
        this.gl.uniform2fv(this.locations.getUniform('resolution'), resolution);

       lights?.forEach((l) => l.render(this.gl, this.locations));
    }
}