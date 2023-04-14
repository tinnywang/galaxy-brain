import { vec3, glMatrix, mat4, quat } from "gl-matrix";

class Matrix {
  private static MINIMUM_FOV = glMatrix.toRadian(60);

  private static MAXIMUM_FOV = glMatrix.toRadian(120);

  private static FOV = glMatrix.toRadian(90);

  private static NEAR = 1;

  private static FAR = 100;

  private static CENTER = vec3.fromValues(0, 0, 0);

  private static UP = vec3.fromValues(0, 1, 0);

  private static EYE = vec3.fromValues(0, 0, 10);

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

  static rotateView(axis: vec3, angle: number) {
    const q = quat.setAxisAngle(
      quat.create(),
      vec3.normalize(axis, axis),
      glMatrix.toRadian(angle)
    );

    Matrix.EYE = vec3.transformQuat(Matrix.EYE, Matrix.EYE, q);
    Matrix.UP = vec3.transformQuat(Matrix.UP, Matrix.UP, q);

    Matrix.viewMatrix = null;

    return q;
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
