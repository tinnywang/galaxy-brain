import vertexSrc from './vertex.glsl';
import fragmentSrc from './fragment.glsl';
import { Shader } from '../shader';

export class TextureShader extends Shader {
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

    constructor(gl: WebGL2RenderingContext) {
        super(gl, vertexSrc, fragmentSrc);

        this.locations.setAttribute('vertexPosition');
        this.locations.setUniform('textureImage');
        this.locations.setUniform('width');
        this.locations.setUniform('height');

        this.verticesBuffer = gl.createBuffer();
        gl.bindBuffer(this.gl.ARRAY_BUFFER, this.verticesBuffer);
        gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(TextureShader.vertices), gl.STATIC_DRAW);
    }

    render(texture: WebGLTexture) {
        this.gl.useProgram(this.program);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.verticesBuffer);
        const vertexPosition = this.locations.getAttribute('vertexPosition');
        this.gl.vertexAttribPointer(vertexPosition, 2, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(vertexPosition);

        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);

        this.gl.uniform1i(this.locations.getUniform('textureImage'), 0);
        this.gl.uniform1i(this.locations.getUniform('width'), this.gl.drawingBufferWidth);
        this.gl.uniform1i(this.locations.getUniform('height'), this.gl.drawingBufferHeight);
        this.gl.drawArrays(this.gl.TRIANGLES, 0, TextureShader.vertices.length);
    }
}
