import { glMatrix, vec3, mat4, quat } from "gl-matrix";
import { Brain } from "./models/brain";
import { Head } from "./models/head";
import { Skull } from "./models/skull";
import Laser from "./laser";
import { Light } from "./light";

class GalaxyBrain {
  readonly light: Light;

  readonly head: Head;

  readonly skull: Skull;

  readonly brain: Brain;

  readonly lasers: Laser;

  constructor(gl: WebGL2RenderingContext) {
    const center = vec3.fromValues(0, 2, 0);
    const model = mat4.fromRotationTranslation(
      mat4.create(),
      quat.rotateY(quat.create(), quat.create(), glMatrix.toRadian(90)),
      center
    );

    this.light = new Light(gl, {
      positions: [center],
    });

    this.head = new Head(gl, model);

    this.skull = new Skull(gl, model);

    this.brain = new Brain(gl, model);

    this.lasers = new Laser(gl, model);
  }
}

export default GalaxyBrain;
