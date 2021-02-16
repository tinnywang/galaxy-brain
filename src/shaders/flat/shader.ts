import vertexSrc from './vertex.glsl';
import fragmentSrc from './fragment.glsl';
import { Shader } from '../shader';
import { Renderable } from '../../renderable';

export class FlatShader extends Shader {
    readonly vertexPosition: number
    readonly modelViewProjectionMatrix: WebGLUniformLocation | null
    readonly color: WebGLUniformLocation | null

    constructor(gl: WebGL2RenderingContext) {
        super(gl, vertexSrc, fragmentSrc);

        this.vertexPosition = this.gl.getAttribLocation(this.program, 'vertexPosition');
        this.modelViewProjectionMatrix = gl.getUniformLocation(this.program, 'modelViewProjectionMatrix');
        this.color = gl.getUniformLocation(this.program, 'color');
   }

    render(r: Renderable) {
        this.gl.useProgram(this.program);

        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.depthFunc(this.gl.LEQUAL);
        this.gl.enable(this.gl.CULL_FACE);
        this.gl.cullFace(this.gl.BACK);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
 
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, r.buffer.vertices);
        this.gl.vertexAttribPointer(this.vertexPosition, 3, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(this.vertexPosition)

        this.gl.uniformMatrix4fv(this.modelViewProjectionMatrix, false, r.matrix.modelViewProjection);

        let offset = 0;
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, r.buffer.faces);
        r.object.faces.forEach((f) => {
            this.gl.uniform3fv(this.color, f.material.diffuse);

            this.gl.drawElements(this.gl.TRIANGLES, f.vertex_indices.length, this.gl.UNSIGNED_SHORT, offset);
            // Offset must be a multiple of 2 since an unsigned short is 2 bytes.
            offset += f.vertex_indices.length * 2;
        })
    }
}