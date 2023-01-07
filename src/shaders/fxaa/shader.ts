import fragmentSrc from './fragment.glsl';
import { PostProcessing } from '../post_processing/shader';

export class FXAA extends PostProcessing {

    constructor(gl: WebGL2RenderingContext) {
        super(gl, { fragmentSrc });
    }

    render(texture: WebGLTexture) {
        super.render(texture);
    }
}
