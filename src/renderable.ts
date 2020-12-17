import { Object } from "./object";

interface Buffers {
    vertices: WebGLBuffer | null;
    faces: WebGLBuffer | null;
    normals: WebGLBuffer | null;
}

export abstract class Renderable {
    readonly buffers: Buffers;
    readonly object: Object;
    readonly gl: WebGLRenderingContext;

    constructor(gl: WebGLRenderingContext, o: Object) {
        const vertices = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertices);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(o.vertices), gl.STATIC_DRAW);

        const normals = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, normals);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(o.normals), gl.STATIC_DRAW);

        const buffer = new Array();
        o.faces.forEach((f) => {
            buffer.push(...f.vertexIndices);
        })

        const faces = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, faces);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(buffer), gl.STATIC_DRAW);

        this.buffers = {
            vertices: vertices,
            normals: normals,
            faces: faces,
        };
        this.object = o;
        this.gl = gl;
    }

    render() {
        let offset = 0;
        this.object.faces.forEach((f) => {
            this.gl.drawElements(this.gl.TRIANGLES, f.vertexIndices.length, this.gl.UNSIGNED_SHORT, offset);
            // Offset must be a multiple of 2 since an unsigned short is 2 bytes.
            offset += f.vertexIndices.length * 2;
        })
    }
}

export class Cube extends Renderable {
    constructor(gl: WebGLRenderingContext, o: Object) {
        super(gl, o)
    }
}