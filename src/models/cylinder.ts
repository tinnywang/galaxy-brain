import { mat4 } from "gl-matrix";
import { Model } from "./model";
import cylinder from "../assets/models/cylinder.json"

export class Cylinder extends Model {
    constructor(gl: WebGL2RenderingContext, model?: mat4) {
        super(gl, cylinder[0], model);
    }
}