import { mat4, vec3 } from "gl-matrix";
import { Model } from "./model";
import brain from "../assets/models/brain.json"
import { Light } from "../light";
import { LightBeam } from "../light_beam";

export class Brain extends Model {
    private static readonly NEURON_PERCENTAGE = 0.005;

    private static readonly NUM_LIGHT_BEAMS = 20;

    readonly neurons: Light;

    readonly stars: Light;

    readonly lightBeams: LightBeam[];

    constructor(gl: WebGL2RenderingContext, model: mat4) {
        super(gl, brain[0], model);

        this.neurons = this.neuronsFromVertices(gl, brain[0].vertices, model);

        const {stars, lightBeams} = this.lightsFromVertices(gl, brain[0].normals, brain[0].normals, model);
        this.stars = stars;
        this.lightBeams = lightBeams;
    }

    private neuronsFromVertices(gl: WebGL2RenderingContext, vertices: number[], model: mat4) {
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

        return new Light(gl, {
          positions,
          model,
          radius: 50,
          color: vec3.fromValues(1, 0, 0.5),
        });
    }

    private lightsFromVertices(gl: WebGL2RenderingContext, vertices: number[], normals: number[], model: mat4) {
        const offset = vertices.length / (Brain.NUM_LIGHT_BEAMS * 3) * 3;

        const positions = [];
        const lightBeams = [];

        for (let i = 0; i < vertices.length; i+= offset) {
            const position = vec3.fromValues(
                vertices[i],
                vertices[i+1],
                vertices[i+2],
            );
            const normal = vec3.fromValues(
                normals[i],
                normals[i+1],
                normals[i+2],
            );

            const star = vec3.add(
                vec3.create(),
                position,
                vec3.scale(
                    vec3.create(),
                    normal,
                    10,
                ),
            );

            positions.push(star);

            lightBeams.push(new LightBeam(gl, {
                position,
                normal,
                model,
                width: 200,
            }));
        }

        return {
            stars: new Light(gl, {
                positions,
                model,
                radius: 100,
                color: vec3.fromValues(0.2, 0.4, 1),
            }),
            lightBeams: lightBeams,
        };
    }
}