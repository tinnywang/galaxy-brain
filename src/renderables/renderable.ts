import { mat4 } from "gl-matrix";
import { Object } from "../object";
import Matrix from "../matrix";

interface Buffer {
  vertices: WebGLBuffer | null;
  faces: WebGLBuffer | null;
  normals: WebGLBuffer | null;
}

export abstract class Renderable {
  readonly buffer: Buffer;

  readonly gl: WebGLRenderingContext;

  readonly matrix: Matrix;

  readonly object: Object;

  constructor(
    gl: WebGLRenderingContext,
    o: Object,
    model?: mat4
  ) {
    const vertices = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertices);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array(o.vertices),
      gl.STATIC_DRAW
    );

    const normals = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normals);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(o.normals), gl.STATIC_DRAW);

    const buffer: number[] = [];
    o.faces.forEach((f) => {
      buffer.push(...f.vertex_indices);
    });

    const faces = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, faces);
    gl.bufferData(
      gl.ELEMENT_ARRAY_BUFFER,
      new Uint16Array(buffer),
      gl.STATIC_DRAW
    );

    this.buffer = {
      vertices,
      normals,
      faces,
    };
    this.gl = gl;
    this.matrix = new Matrix(gl, model);
    this.object = o;
  }
}

