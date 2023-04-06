import { vec3, glMatrix, mat4 } from "gl-matrix";

namespace Matrix {
  const FOV = glMatrix.toRadian(90);
  const NEAR = 1;
  const FAR = 100;
  const CENTER = vec3.fromValues(0, 0, 0);
  const UP = vec3.fromValues(0, 1, 0);

  const _eye = vec3.fromValues(0, 0, 10);
  let _view: mat4 | null;
  let _projection: mat4 | null;

  export function projection(gl: WebGL2RenderingContext) {
    if (!_projection) {
      _projection = mat4.perspective(
        mat4.create(),
        FOV,
        gl.drawingBufferWidth / gl.drawingBufferHeight,
        NEAR,
        FAR
      );
    }

    return _projection;
  }

  export function view() {
    if (!_view) {
      _view = mat4.lookAt(mat4.create(), _eye, CENTER, UP);
    }

    return _view;
  }

  export function modelView(model?: mat4) {
    return mat4.multiply(mat4.create(), view(), model ?? mat4.create());
  }

  export function eye() {
    return _eye;
  }

  export function rotateView(angle: number, axis?: vec3) {
    if (axis && _view) {
      _view = mat4.rotate(mat4.create(), _view, glMatrix.toRadian(angle), axis);
    }
  }
}

export default Matrix;
