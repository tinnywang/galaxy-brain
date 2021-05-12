import vertexSrc from './vertex.glsl';
import fragmentSrc from './fragment.glsl';
import { Shader } from '../shader';

export class ImageShader extends Shader {
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

    private vertexPosition: number;
    private imageTexture: WebGLUniformLocation | null;
    private verticesBuffer: WebGLBuffer | null;

    constructor(gl: WebGL2RenderingContext) {
        super(gl, vertexSrc, fragmentSrc);

        this.vertexPosition = gl.getAttribLocation(this.program, 'vertexPosition');
        this.imageTexture = gl.getUniformLocation(this.program, 'imageTexture');

        this.verticesBuffer = gl.createBuffer();
        gl.bindBuffer(this.gl.ARRAY_BUFFER, this.verticesBuffer);
        gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(ImageShader.vertices), gl.STATIC_DRAW);
    }

    render(texture: WebGLTexture) {
        this.gl.useProgram(this.program);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.verticesBuffer);
        this.gl.vertexAttribPointer(this.vertexPosition, 2, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(this.vertexPosition);

        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);

        this.gl.uniform1i(this.imageTexture, 0);
        this.gl.drawArrays(this.gl.TRIANGLES, 0, ImageShader.vertices.length);
    }
}
