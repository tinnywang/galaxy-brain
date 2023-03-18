import vertexSrc from './vertex.glsl';
import { Light } from '../../light';
import { Shader } from '../shader';
import WebGL2 from '../../gl';

export interface LensFlareProps {
    fragmentSrc: string;
    imageSrc: string;
}

export class LensFlare extends Shader<Light> {
    private texture: WebGLTexture;

    constructor(gl: WebGL2RenderingContext, props: LensFlareProps) {
        super(gl, vertexSrc, props.fragmentSrc);

        this.texture = WebGL2.createImageTexture(gl, props.imageSrc);

        this.locations.setAttribute('vertexPosition');
        this.locations.setUniform('modelViewMatrix');
        this.locations.setUniform('projectionMatrix');

        this.locations.setUniform('radius');
        this.locations.setUniform('color');

        this.locations.setUniform('lensFlareTexture');
    }

    render(timestamp: DOMHighResTimeStamp, drawFramebuffer: WebGLFramebuffer, ...lights: Light[]) {
        this.gl.bindFramebuffer(this.gl.DRAW_FRAMEBUFFER, drawFramebuffer);

        super.render(timestamp, drawFramebuffer, ...lights);

        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
        this.gl.uniform1i(this.locations.getUniform('lensFlareTexture'), 0);

        lights?.forEach((l) => l.render(this.gl, this.locations));
    }
}
