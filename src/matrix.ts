import { vec3, glMatrix, mat4 } from "gl-matrix";

class Matrix {
  static readonly EYE = vec3.fromValues(0, 0, 10);

  private static MINIMUM_FOV = glMatrix.toRadian(60);

  private static MAXIMUM_FOV = glMatrix.toRadian(120);

  private static FOV = glMatrix.toRadian(90);

  private static NEAR = 1;

  private static FAR = 100;

  private static CENTER = vec3.fromValues(0, 0, 0);

  private static UP = vec3.fromValues(0, 1, 0);

  private static projectionMatrix: mat4 | null;

  private static viewMatrix: mat4 | null;

  static projection(gl: WebGL2RenderingContext) {
    if (!Matrix.projectionMatrix) {
      Matrix.projectionMatrix = mat4.perspective(
        mat4.create(),
        Matrix.FOV,
        gl.drawingBufferWidth / gl.drawingBufferHeight,
        Matrix.NEAR,
        Matrix.FAR
      );
    }

    return Matrix.projectionMatrix;
  }

  static view() {
    if (!Matrix.viewMatrix) {
      Matrix.viewMatrix = mat4.lookAt(
        mat4.create(),
        Matrix.EYE,
        Matrix.CENTER,
        Matrix.UP
      );
    }

    return Matrix.viewMatrix;
  }

  static modelView(model?: mat4) {
    return mat4.multiply(mat4.create(), Matrix.view(), model ?? mat4.create());
  }

  static rotateView(angle: number, axis: vec3) {
    Matrix.viewMatrix = mat4.rotate(
      mat4.create(),
      Matrix.view(),
      glMatrix.toRadian(angle),
      axis
    );
  }

  static zoom(delta: number) {
    Matrix.FOV = Math.max(
      Matrix.MINIMUM_FOV,
      Math.min(Matrix.MAXIMUM_FOV, Matrix.FOV + delta)
    );
    Matrix.projectionMatrix = null;
  }
}

export default Matrix;
