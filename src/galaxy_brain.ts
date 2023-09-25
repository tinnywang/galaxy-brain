import { glMatrix, vec3, mat4, quat } from "gl-matrix";
import { Brain } from "./models/brain";
import { Head } from "./models/head";
import { Skull } from "./models/skull";
import Laser from "./laser";
import { Light } from "./light";
import { Glow } from "./shaders/glow/shader";
import { Star } from "./shaders/star/shader";
import { TransparentShader } from "./shaders/transparent/shader";
import { CrepuscularRay } from "./shaders/crepuscular_ray/shader";
import { Animation } from "./animations/animation";
import { FadeIn, FadeOut } from "./animations/fade";
import { Scale } from "./animations/scale";
import { Rotation } from "./animations/rotation";

interface Shaders {
  transparent: TransparentShader;
  crepuscularRay: CrepuscularRay;
  star: Star;
  glow: Glow;
}

class GalaxyBrain {
  readonly light: Light;

  readonly head: Head;

  readonly skull: Skull;

  readonly brain: Brain;

  readonly lasers: Laser;

  private readonly shaders: Shaders;

  private models: mat4[];

  private stage = 0;

  private static readonly STAGE_ANGLES: { [stage: number]: number } = {
    0: glMatrix.toRadian(-90),
    1: glMatrix.toRadian(90),
    2: glMatrix.toRadian(90),
    3: glMatrix.toRadian(210),
  };

  constructor(gl: WebGL2RenderingContext, shaders: Shaders) {
    this.shaders = shaders;

    const model = mat4.fromRotationTranslation(
      mat4.create(),
      quat.rotateY(quat.create(), quat.create(), glMatrix.toRadian(-90)),
      vec3.fromValues(0, 2, 0),
    );

    this.head = new Head(gl, model);
    this.head.alpha = 0;

    this.skull = new Skull(gl, model);

    this.brain = new Brain(
      gl,
      mat4.scale(mat4.create(), model, vec3.fromValues(0.5, 0.5, 0.5))
    );
    this.brain.neurons.alpha = 0;

    this.lasers = new Laser(gl, model);
    this.lasers.beams.forEach((b) => {
      b.alpha = 0;
    });
    this.lasers.stars.alpha = 0;

    this.light = new Light(gl, {
      positions: [vec3.fromValues(0, -10, -10), vec3.fromValues(0, 10, 10)],
      alpha: 1.0,
    });

    this.models = [
      model,
      this.brain.model,
      ...this.lasers.beams.map((b) => b.model),
    ];
  }

  render(timestamp: DOMHighResTimeStamp, framebuffer: WebGLFramebuffer) {
    // Render the laser beams behind the stars.
    this.shaders.star.render(timestamp, framebuffer, this.lasers.stars);

    this.shaders.transparent.render(
      timestamp,
      framebuffer,
      this.head,
      this.skull,
      this.brain
    );

    this.shaders.crepuscularRay.render(timestamp, framebuffer, {
      models: this.lasers.beams,
      light: this.lasers.light,
    });
    this.shaders.crepuscularRay.render(timestamp, framebuffer, {
      models: [this.brain],
      light: this.light,
    });

    this.shaders.glow.render(timestamp, framebuffer, this.brain.neurons);
  }

  evolve(stage: number) {
    // It's okay to calculate rotation axis and angle from the brain
    // because all the models share the same rotation axis and angle.
    const { angle: rotationAngle, axis } = this.brain.rotation();
    let angle = rotationAngle - GalaxyBrain.STAGE_ANGLES[stage];
    if (this.stage > stage) {
      angle *= -1;
    }

    switch (stage) {
      case 0:
        Animation.run(
          new Scale(this.brain.model, 0.5, 500),
          new FadeIn(this.skull, 1000),
          new FadeOut(this.head, 1000),
          new FadeOut(this.brain.neurons, 1000),
          ...this.lasers.beams.map((b) => new FadeOut(b, 1000)),
          new FadeOut(this.lasers.stars, 500),
          new Rotation(this.models, axis, angle, 500)
        );
        break;
      case 1:
      case 2:
        Animation.run(
          new Scale(this.brain.model, 1 / this.brain.scaling(), 500),
          stage === 1
            ? new FadeIn(this.brain.neurons, 1000)
            : new FadeOut(this.brain.neurons, 1000),
          ...this.lasers.beams.map((b) => new FadeOut(b, 1000)),
          new FadeOut(this.lasers.stars, 500),
          new FadeIn(this.head, 1000),
          new FadeOut(this.skull, 1000),
          new Rotation(this.models, axis, angle, 500)
        );
        break;
      case 3:
        Animation.run(
          new Scale(this.brain.model, 1 / this.brain.scaling(), 500),
          new FadeOut(this.brain.neurons, 1000),
          new FadeIn(this.head, 1000),
          ...this.lasers.beams.map((b) => new FadeIn(b, 500)),
          new FadeIn(this.lasers.stars, 1000),
          new Rotation(this.models, axis, angle, 500)
        );
        break;
      default:
        break;
    }

    this.stage = stage;
  }
}

export default GalaxyBrain;
