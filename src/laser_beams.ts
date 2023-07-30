import { mat4, vec3, quat } from "gl-matrix";
import { Cylinder } from "./models/cylinder";
import { Model } from "./models/model";
import Matrix from "./matrix";

export interface LaserBeamsProps {
    model?: mat4,
    color?: vec3,
}

export class LaserBeams{
    private static GoldenRatio = 0.61803398875;

    private static Coordinates = [
        [1, 1, 1],
        [0, LaserBeams.GoldenRatio, 1 / LaserBeams.GoldenRatio],
        [1 / LaserBeams.GoldenRatio, 0, LaserBeams.GoldenRatio],
        [LaserBeams.GoldenRatio, 1 / LaserBeams.GoldenRatio, 0],
    ];

    readonly apertures: Model[];

    constructor(gl: WebGL2RenderingContext, props: LaserBeamsProps) {
        // Generate the coordinates of a regular dodecahedron.
        // https://en.wikipedia.org/wiki/Regular_dodecahedron#Cartesian_coordinates
        const dodecahedronVertices = LaserBeams.Coordinates.flatMap((c) => {
            return this.permutate(c).map((p) => vec3.fromValues(p[0], p[1], p[2]));
        });

        this.apertures = dodecahedronVertices.map((d) => {
            const q = quat.rotationTo(quat.create(), Matrix.UP, vec3.normalize(vec3.create(), d));
            const model = mat4.fromRotationTranslationScale(
                mat4.create(),
                q,
                vec3.scale(vec3.create(), d, 3.5),
                vec3.fromValues(0.15, 5, 0.15),
            );
            return new Cylinder(gl, model);
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