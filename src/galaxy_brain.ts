import { glMatrix, vec3, mat4, quat } from "gl-matrix";
import { Brain } from "./models/brain";
import { Head } from "./models/head";
import { Skull } from "./models/skull";
import { Light } from "./light";
import { LaserBeams } from "./laser_beams";

export class GalaxyBrain {
    readonly head: Head;
    readonly skull: Skull;
    readonly brain: Brain;
    readonly stars: Light;
    readonly lasers: LaserBeams;

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

        const positions = this.dodecahedronVertices();
        const color = vec3.fromValues(0.2, 0.4, 0.8);

        this.stars = new Light(gl, {
            positions,
            model,
            color,
            radius: 100,
        });

        this.lasers = new LaserBeams(gl, {
            model,
            color,
        });
    }

    // Generate the coordinates of a regular dodecahedron.
    // https://en.wikipedia.org/wiki/Regular_dodecahedron#Cartesian_coordinates
    private dodecahedronVertices(): vec3[] {
        const goldenRatio = 0.61803398875;
        const vertices = [
            [1, 1, 1],
            [0, goldenRatio, 1 / goldenRatio],
            [1 / goldenRatio, 0, goldenRatio],
            [goldenRatio, 1 / goldenRatio, 0],
        ];

        return vertices.flatMap((c) => {
            return this.permutate(c).map((p) => {
                return vec3.scale(
                    vec3.create(),
                    vec3.fromValues(p[0], p[1], p[2]),
                    Math.random() * 10 + 10,
                );
            });
        });
    }

    private permutate(vertex: number[]): number[][] {
        if (vertex.length === 0) {
            return [[]]
        }

        return this.permutate(vertex.slice(1)).flatMap((v) => {
            const permutations = [[vertex[0], ...v]];
            if (vertex[0] !== 0) {
                permutations.push([-vertex[0], ...v]);
            }

            return permutations;
        });
    }
}