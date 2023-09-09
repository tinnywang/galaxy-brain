import { mat4, vec3 } from "gl-matrix";
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

  readonly object: Object;

  private model: mat4;

  alpha = 1;

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

    const faces = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, faces);
    gl.bufferData(
      gl.ELEMENT_ARRAY_BUFFER,
      o.faces.reduce((accumulator, f) => accumulator + f.vertex_indices.length * 8, 0),
      gl.STATIC_DRAW,
    );

    let offset = 0;
    o.faces.forEach((f) => {
      gl.bufferSubData(gl.ELEMENT_ARRAY_BUFFER, offset, new Uint32Array(f.vertex_indices), offset);
      // Offset must be a multiple of 8 since an unsigned int is 8 bytes.
      offset += f.vertex_indices.length * 8;
    });

    this.buffer = {
      vertices,
      normals,
      faces,
    };
    this.gl = gl;
    this.model = model ?? mat4.create();
    this.object = o;
  }

  render(gl: WebGL2RenderingContext, locations: ShaderLocations, perFace?: (f: Face) => void) {
    if (this.alpha == 0) {
      return;
    }

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

    gl.uniformMatrix4fv(locations.getUniform('modelViewMatrix'), false, Matrix.modelView(this.model));
    gl.uniformMatrix4fv(locations.getUniform('projectionMatrix'), false, Matrix.projection(gl));

    let offset = 0;
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffer.faces);
    this.object.faces.forEach((f) => {
      perFace?.(f);

      this.gl.drawElements(this.gl.TRIANGLES, f.vertex_indices.length, this.gl.UNSIGNED_INT, offset);
      // Offset must be a multiple of 8 since an unsigned int is 8 bytes.
      offset += f.vertex_indices.length * 8;
    })
  }

  scale(n: number) {
    this.model = mat4.scale(mat4.create(), this.model, vec3.fromValues(n, n, n));
  }

  getScale(): number {
    const v = mat4.getScaling(vec3.create(), this.model);
    return v[0]
  }
}
