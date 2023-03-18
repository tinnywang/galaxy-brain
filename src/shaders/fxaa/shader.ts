import fragmentSrc from './fragment.glsl';
import { PostProcessing } from '../post_processing/shader';

export class FXAA extends PostProcessing {

    constructor(gl: WebGL2RenderingContext) {
        super(gl, undefined, fragmentSrc);
    }

    render(timestamp: DOMHighResTimeStamp, texture: WebGLTexture) {
        super.render(timestamp, texture);
    }
}
