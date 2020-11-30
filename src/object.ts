import {vec3} from "gl-matrix";

export interface Object {
    name: string
    faces: Array<Face>
    normals: Array<number>
    vertices: Array<number>
}

interface Face {
    material: Material
    vertexIndices: Array<number>
}

interface Material {
    ambient: vec3,
    diffuse: vec3,
    specular: vec3,
    specularExponent: number,
}

interface Buffers {
    vertices: WebGLBuffer | null;
    faces: WebGLBuffer | null;
    normals: WebGLBuffer | null;
}

export abstract class Renderable {
    readonly buffers: Buffers;

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
    }

    render(): void {
    }
}

export class Cube extends Renderable {
    constructor(gl: WebGLRenderingContext, o: Object) {
        super(gl, o)
    }

    render(): void {
        throw new Error("Method not implemented.");
    }

}