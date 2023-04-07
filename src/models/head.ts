import { mat4 } from "gl-matrix";
import { Model } from "./model";
import head from "../assets/models/head.json";

export class Head extends Model {
    constructor(gl: WebGL2RenderingContext, model: mat4) {
        super(gl, head[0], model);
    }
}