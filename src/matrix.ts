import { vec3, glMatrix, mat4 } from "gl-matrix";

class Matrix {
  static readonly EYE = vec3.fromValues(0, 0, 10);

  private static readonly CENTER = vec3.fromValues(0, 0, 0);

  private static readonly UP = vec3.fromValues(0, 1, 0);

  private static readonly FOV = glMatrix.toRadian(90);

  private static readonly NEAR = 1;

  private static readonly FAR = 100;

  private view: mat4;

  readonly projection: mat4;

  readonly modelView: mat4;

  constructor(gl: WebGL2RenderingContext, model?: mat4) {
    this.view = mat4.lookAt(
      mat4.create(),
      Matrix.EYE,
      Matrix.CENTER,
      Matrix.UP
    );
    this.projection = mat4.perspective(
      mat4.create(),
      Matrix.FOV,
      gl.drawingBufferWidth / gl.drawingBufferHeight,
      Matrix.NEAR,
      Matrix.FAR
    );
    this.modelView = mat4.multiply(
      mat4.create(),
      this.view,
      model || mat4.create()
    );
  }
}

export default Matrix;
