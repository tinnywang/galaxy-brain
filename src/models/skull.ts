import { mat4 } from "gl-matrix";
import { Model } from "./model";
import skull from "../assets/models/skull.json";

export class Skull extends Model {
    constructor(gl: WebGL2RenderingContext, model: mat4) {
        super(gl, skull[0], model);
    }
}