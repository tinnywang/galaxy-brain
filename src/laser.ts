import { glMatrix, mat4, vec3, quat } from "gl-matrix";
import { Cylinder } from "./models/cylinder";
import { Light } from "./light";
import Matrix from "./matrix";

class Laser {
  private static GoldenRatio = 0.61803398875;

  private static Coordinates = [
    [1, 1, 1],
    [0, Laser.GoldenRatio, 1 / Laser.GoldenRatio],
    [1 / Laser.GoldenRatio, 0, Laser.GoldenRatio],
    [Laser.GoldenRatio, 1 / Laser.GoldenRatio, 0],
  ];

  readonly light: Light;

  readonly beams: Cylinder[];

  readonly stars: Light;

  constructor(gl: WebGL2RenderingContext, color: vec3, model?: mat4) {
    this.light = new Light(gl, {
      positions: [mat4.getTranslation(vec3.create(), model ?? mat4.create())],
    });

    // Generate the coordinates of a regular dodecahedron.
    // https://en.wikipedia.org/wiki/Regular_dodecahedron#Cartesian_coordinates
    const vertices = Laser.Coordinates.flatMap((c) =>
      this.permutate(c).map((p) => {
        const v = vec3.fromValues(p[0], p[1], p[2]);
        const r = Math.floor(Math.random() * 5);
        return vec3.scale(v, v, 5 + r);
      })
    ).filter((v) => vec3.angle(v, Matrix.Y_AXIS) < glMatrix.toRadian(135));

    this.beams = vertices.map((v) => {
      const q = quat.rotationTo(
        quat.create(),
        Matrix.Y_AXIS,
        vec3.normalize(vec3.create(), v)
      );
      let m = mat4.fromRotationTranslationScale(
        mat4.create(),
        q,
        vec3.scale(vec3.create(), v, 0.65),
        vec3.fromValues(0.2, 7, 0.2)
      );
      m = mat4.multiply(m, model ?? mat4.create(), m);
      return new Cylinder(gl, m);
    });

    this.stars = new Light(gl, {
      positions: vertices,
      model,
      color,
      radius: 120,
    });
  }

  permutate(vertex: number[]): number[][] {
    if (vertex.length === 0) {
      return [[]];
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

export default Laser;
