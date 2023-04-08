import { glMatrix, vec3, mat4, quat } from "gl-matrix";
import { Brain } from "./models/brain";
import { Head } from "./models/head";
import { Skull } from "./models/skull";

export class GalaxyBrain {
    readonly head: Head;
    readonly skull: Skull;
    readonly brain: Brain;

    constructor(gl: WebGL2RenderingContext) {
        const model = mat4.fromRotationTranslationScale(
            mat4.create(),
            quat.rotateY(quat.create(), quat.create(), glMatrix.toRadian(90)),
            vec3.fromValues(0, 0, 0),
            vec3.fromValues(1, 1, 1),
        );

        this.head = new Head(gl, model);
        this.skull = new Skull(gl, model);
        this.brain = new Brain(gl, model);
    }
}