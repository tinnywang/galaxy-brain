import { mat4 } from "gl-matrix";
import { Face, Object } from "../object";
import Matrix from "../matrix";
import { ShaderLocations } from "../shaders/shader_locations";

interface Buffer {
  vertices: WebGLBuffer | null;
  faces: WebGLBuffer | null;
  normals: WebGLBuffer | null;
}

export abstract class Model {
  readonly buffer: Buffer;

  readonly gl: WebGL2RenderingContext;

  readonly matrix: Matrix;

  readonly object: Object;

  constructor(
    gl: WebGL2RenderingContext,
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

  render(gl: WebGL2RenderingContext, locations: ShaderLocations, perFace?: (f: Face) => void) {
    const vertexPosition = locations.getAttribute('vertexPosition');
    if (vertexPosition !== null) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer.vertices);
      gl.vertexAttribPointer(vertexPosition, 3, this.gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(vertexPosition);
    }

    const normal = locations.getAttribute('normal');
    if (normal !== null) {
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer.normals);
      this.gl.vertexAttribPointer(normal, 3, this.gl.FLOAT, false, 0, 0);
      this.gl.enableVertexAttribArray(normal);
    }

    gl.uniformMatrix4fv(locations.getUniform('modelViewMatrix'), false, this.matrix.modelView);
    gl.uniformMatrix4fv(locations.getUniform('projectionMatrix'), false, this.matrix.projection);

    let offset = 0;
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffer.faces);
    this.object.faces.forEach((f) => {
      perFace?.(f);

      this.gl.drawElements(this.gl.TRIANGLES, f.vertex_indices.length, this.gl.UNSIGNED_SHORT, offset)
      // Offset must be a multiple of 2 since an unsigned short is 2 bytes.
      offset += f.vertex_indices.length * 2
    })
  }
}

