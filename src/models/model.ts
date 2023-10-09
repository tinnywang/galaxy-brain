import { mat4, quat, vec3 } from "gl-matrix";
import { Object } from "../object";
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

  readonly model: mat4;

  alpha = 1;
 
  color = vec3.fromValues(1, 1, 1);

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
      new Uint32Array(o.faces),
      gl.STATIC_DRAW,
    );

    this.buffer = {
      vertices,
      normals,
      faces,
    };
    this.gl = gl;
    this.model = model ?? mat4.create();
    this.object = o;
  }

  render(gl: WebGL2RenderingContext, locations: ShaderLocations) {
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

    this.gl.drawElements(this.gl.TRIANGLES, this.object.faces.length, this.gl.UNSIGNED_INT, offset);
    // Offset must be a multiple of 8 since an unsigned int is 8 bytes.
    offset += this.object.faces.length * 8;
  }

  scaling() {
    return mat4.getScaling(vec3.create(), this.model)[0];
  }

  rotation() {
    const q = mat4.getRotation(quat.create(), this.model);
    let axis = vec3.create();
    let angle = quat.getAxisAngle(axis, q);

    // All rotations are relative to the positive y-axis.
    if (axis[1] < 0) {
      axis = vec3.scale(axis, axis, -1);
      angle *= -1;
    }

    return {
      angle: angle,
      axis: axis,
    }
  }
}
