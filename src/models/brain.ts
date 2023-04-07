import { mat4 } from "gl-matrix";
import { Model } from "./model";
import brain from "../assets/models/brain.json"

export class Brain extends Model {
    constructor(gl: WebGL2RenderingContext, model: mat4) {
        super(gl, brain[0], model);
    }
}