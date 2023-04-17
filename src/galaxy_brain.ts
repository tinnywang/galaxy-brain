import { glMatrix, vec3, mat4, quat } from "gl-matrix";
import { Brain } from "./models/brain";
import { Head } from "./models/head";
import { Skull } from "./models/skull";
import { LightBeams } from "./light_beams";

export class GalaxyBrain {
    readonly head: Head;
    readonly skull: Skull;
    readonly brain: Brain;
    readonly lightBeams: LightBeams;

    constructor(gl: WebGL2RenderingContext) {
        const model = mat4.fromRotationTranslationScale(
            mat4.create(),
            quat.rotateY(quat.create(), quat.create(), glMatrix.toRadian(90)),
            vec3.fromValues(0, 2, 0),
            vec3.fromValues(1, 1, 1),
        );

        this.head = new Head(gl, model);
        this.skull = new Skull(gl, model);
        this.brain = new Brain(gl, model);
        this.lightBeams = new LightBeams(gl, {
            model,
            color: vec3.fromValues(0.2, 0.4, 0.8),
        });
    }
}