import { glMatrix, mat4, vec3 } from "gl-matrix";
import { Object } from "../object";
import { Renderable } from "./renderable";

export class Cube extends Renderable {
  constructor(gl: WebGLRenderingContext, o: Object) {
    let model = mat4.rotateX(
      mat4.create(),
      mat4.create(),
      glMatrix.toRadian(30)
    );
    model = mat4.rotateY(model, model, glMatrix.toRadian(45));
    super(gl, o, model);
  }
}

export class Cube2 extends Renderable {
  constructor(gl: WebGLRenderingContext, o: Object) {
    const model = mat4.scale(mat4.create(), mat4.create(), vec3.fromValues(2, 2, 2));
    super(gl, o, model);
  }
}