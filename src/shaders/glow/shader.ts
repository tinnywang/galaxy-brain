import fragmentSrc from './fragment.glsl';
import vertexSrc from './vertex.glsl';
import { Light } from '../../light';
import { Shader } from '../shader';
import WebGL2 from '../../gl';
import Image from "../../assets/glow.png";

export class Glow extends Shader<Light> {
    private lightTexture: WebGLTexture;

    constructor(gl: WebGL2RenderingContext) {
        super(gl, vertexSrc, fragmentSrc);

        this.lightTexture = WebGL2.createImageTexture(gl, Image);

        this.locations.setAttribute('vertexPosition');
        this.locations.setUniform('modelViewMatrix');
        this.locations.setUniform('projectionMatrix');

        this.locations.setUniform('radius');
        this.locations.setUniform('color');

        this.locations.setUniform('lightTexture');
    }

    render(drawFramebuffer: WebGLFramebuffer, ...lights: Light[]) {
        this.gl.bindFramebuffer(this.gl.DRAW_FRAMEBUFFER, drawFramebuffer);

        super.render(drawFramebuffer, ...lights);

        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.lightTexture);
        this.gl.uniform1i(this.locations.getUniform('lightTexture'), 0);

        lights?.forEach((l) => l.render(this.gl, this.locations));
    }
}