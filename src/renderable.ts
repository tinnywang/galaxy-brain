import { Object } from "./object";
import { Shader } from "./shaders/shader";
import { glMatrix, mat4 } from "gl-matrix";
import { Matrix } from "./matrix";

interface Buffer {
    vertices: WebGLBuffer | null;
    faces: WebGLBuffer | null;
    normals: WebGLBuffer | null;
}

export abstract class Renderable {
    readonly buffers: Buffer;
    readonly gl: WebGLRenderingContext;
    readonly matrix: Matrix;
    readonly object: Object;
    readonly shader: Shader;

    constructor(gl: WebGLRenderingContext, shader: Shader, o: Object, model?: mat4) {
        const vertices = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertices);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(o.vertices), gl.STATIC_DRAW);

        const normals = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, normals);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(o.normals), gl.STATIC_DRAW);

        const buffer = new Array();
        o.faces.forEach((f) => {
            buffer.push(...f.vertex_indices);
        })

        const faces = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, faces);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(buffer), gl.STATIC_DRAW);

        this.buffers = {
            vertices: vertices,
            normals: normals,
            faces: faces,
        };
        this.gl = gl;
        this.matrix = new Matrix(gl, model)
        this.object = o;
        this.shader = shader;
    }

    render() {
        this.gl.uniformMatrix4fv(this.shader.modelViewProjectionMatrix, false, this.matrix.modelViewProjection);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.vertices);
        this.gl.vertexAttribPointer(this.shader.vertexPosition, 3, this.gl.FLOAT, false, 0, 0);

        let offset = 0;
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.buffers.faces);
        this.object.faces.forEach((f) => {
            this.gl.uniform3fv(this.shader.color, f.material.diffuse);
            this.gl.drawElements(this.gl.TRIANGLES, f.vertex_indices.length, this.gl.UNSIGNED_SHORT, offset);
            // Offset must be a multiple of 2 since an unsigned short is 2 bytes.
            offset += f.vertex_indices.length * 2;
        })
    }
}

export class Cube extends Renderable {
    constructor(gl: WebGLRenderingContext, shader: Shader, o: Object) {
        let model = mat4.rotateX(mat4.create(), mat4.create(), glMatrix.toRadian(30));
        model = mat4.rotateY(model, model, glMatrix.toRadian(45));
        super(gl, shader, o, model);
    }
}