import { mat4, vec3 } from "gl-matrix";
import { Model } from "./model";
import brain from "../assets/models/brain.json"
import { Light } from "../light";

export class Brain extends Model {
    private static readonly NEURON_PERCENTAGE = 0.005;

    readonly neurons: Light;

    constructor(gl: WebGL2RenderingContext, model: mat4) {
        super(gl, brain[0], model);

        const vertices = brain[0].vertices;
        const offset = Math.max(Math.floor(1 / Brain.NEURON_PERCENTAGE), 1) * 3;
        let positions = [];

        for (let i = 0; i < vertices.length; i += offset) {
            positions.push(vec3.fromValues(
                vertices[i],
                vertices[i+1],
                vertices[i+2],
            ));
        }

        // Sort by y-value.
        positions.sort((p1, p2) => p2[1] - p1[1]);
        // Remove the bottom 1/4th.
        positions = positions.slice(0, positions.length - positions.length / 4);

        this.neurons = new Light(gl, {
          positions,
          model,
          radius: 50,
          color: vec3.fromValues(1, 0, 0.5),
        });
    }
}