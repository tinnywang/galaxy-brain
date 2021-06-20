import { glMatrix, mat4 } from "gl-matrix";
import { Object } from "../object";
import { Shader } from "../shaders/shader";
import { Renderable } from "./renderable";

export class Cube extends Renderable {
  constructor(gl: WebGLRenderingContext, shader: Shader, o: Object) {
    let model = mat4.rotateX(
      mat4.create(),
      mat4.create(),
      glMatrix.toRadian(30)
    );
    model = mat4.rotateY(model, model, glMatrix.toRadian(45));
    super(gl, shader, o, model);
  }
}