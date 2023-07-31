import { mat4, vec3, quat } from "gl-matrix";
import { Cylinder } from "./models/cylinder";
import Matrix from "./matrix";
import { Light } from "./light";

export class Laser {
    private static GoldenRatio = 0.61803398875;

    private static Coordinates = [
        [1, 1, 1],
        [0, Laser.GoldenRatio, 1 / Laser.GoldenRatio],
        [1 / Laser.GoldenRatio, 0, Laser.GoldenRatio],
        [Laser.GoldenRatio, 1 / Laser.GoldenRatio, 0],
    ];

    readonly beams: Cylinder[];

    readonly stars: Light;

    constructor(gl: WebGL2RenderingContext) {
        // Generate the coordinates of a regular dodecahedron.
        // https://en.wikipedia.org/wiki/Regular_dodecahedron#Cartesian_coordinates
        const vertices = Laser.Coordinates.flatMap((c) => {
            return this.permutate(c).map((p) => {
                return vec3.scale(vec3.create(), vec3.fromValues(p[0], p[1], p[2]), 5);
            });
        });

        this.beams = vertices.map((v) => {
            const q = quat.rotationTo(quat.create(), Matrix.UP, vec3.normalize(vec3.create(), v));
            const model = mat4.fromRotationTranslationScale(
                mat4.create(),
                q,
                vec3.scale(vec3.create(), v, 0.75),
                vec3.fromValues(0.2, 5, 0.2),
            );
            return new Cylinder(gl, model);
        });

        this.stars = new Light(gl, {
            positions: vertices,
            color: vec3.fromValues(0.2, 0.4, 0.8),
            radius: 100,
        });
    }

    permutate(vertex: number[]): number[][] {
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