import vertexSrc from './vertex.glsl';
import fragmentSrc from './fragment.glsl';
import { Shader } from '../shader';

export interface PostProcessingProps {
    vertexSrc?: string;
    fragmentSrc?: string;
}

export class PostProcessing<T = void> extends Shader<T> {
    // These are already in normalized device coordinates and don't need to be
    // multiplied by the model-view-projection matrix.
    private static vertices = [
        1, 1,
        -1, 1,
        -1, -1,
        -1, -1,
        1, -1,
        1, 1
    ];

    private verticesBuffer: WebGLBuffer | null;

    constructor(gl: WebGL2RenderingContext, _vertexSrc?: string, _fragmentSrc?: string) {
        super(gl, _vertexSrc ?? vertexSrc, _fragmentSrc ?? fragmentSrc);

        this.locations.setAttribute('vertexPosition');
        this.locations.setUniform('textureImage');

        this.verticesBuffer = gl.createBuffer();
        gl.bindBuffer(this.gl.ARRAY_BUFFER, this.verticesBuffer);
        gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(PostProcessing.vertices), gl.STATIC_DRAW);
    }

    render(timestamp: DOMHighResTimeStamp, texture: WebGLTexture, ...renderables: T[]) {
        super.render(timestamp, texture, ...renderables);

        const vertexPosition = this.locations.getAttribute('vertexPosition');
        if (vertexPosition !== null) {
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.verticesBuffer);
            this.gl.vertexAttribPointer(vertexPosition, 2, this.gl.FLOAT, false, 0, 0);
            this.gl.enableVertexAttribArray(vertexPosition);
        }

        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);

        this.gl.uniform1i(this.locations.getUniform('textureImage'), 0);
        this.gl.drawArrays(this.gl.TRIANGLES, 0, PostProcessing.vertices.length);
    }
}
