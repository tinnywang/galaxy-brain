import { mat4, glMatrix } from "gl-matrix";
import { Object } from "../object";
import { Model } from "./model";

export class Teapot extends Model {
    constructor(gl: WebGL2RenderingContext, o: Object) {
        let model = mat4.rotateX(
            mat4.create(),
            mat4.create(),
            glMatrix.toRadian(30)
        );
        model = mat4.rotateY(model, model, glMatrix.toRadian(-30));
        super(gl, o, model);
    }
}