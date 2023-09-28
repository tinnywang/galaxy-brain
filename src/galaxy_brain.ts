import { glMatrix, vec3, mat4, quat } from "gl-matrix";
import { Brain } from "./models/brain";
import { Head } from "./models/head";
import { Model } from "./models/model";
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

interface Stage {
  angle: number;
  color: vec3;
}

class GalaxyBrain {
  readonly light: Light;

  readonly head: Head;

  readonly skull: Skull;

  readonly brain: Brain;

  readonly lasers: Laser;

  private readonly shaders: Shaders;

  private matrices: mat4[];

  private models: Model[];

  private stage = 0;

  private static readonly STAGES: { [stage: number]: Stage } = {
    0: {
      angle: glMatrix.toRadian(-90),
      color: vec3.fromValues(0.141, 0.247, 0.557),
    },
    1: {
      angle: glMatrix.toRadian(90),
      color: vec3.fromValues(0.098, 0.016, 0.573),
    },
    2: {
      angle: glMatrix.toRadian(90),
      color: vec3.fromValues(0.325, 0.043, 0),
    },
    3: {
      angle: glMatrix.toRadian(210),
      color: vec3.fromValues(0.008, 0.380, 0.702),
    },
  };

  constructor(gl: WebGL2RenderingContext, shaders: Shaders) {
    this.shaders = shaders;

    const model = mat4.fromRotationTranslation(
      mat4.create(),
      quat.rotateY(quat.create(), quat.create(), glMatrix.toRadian(-90)),
      vec3.fromValues(0, 2, 0)
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
      positions: [vec3.fromValues(0, 0, 0)],
      alpha: 0,
    });

    this.matrices = [
      model,
      this.brain.model,
      ...this.lasers.beams.map((b) => b.model),
    ];

    this.models = [this.head, this.skull, this.brain];
    this.models.forEach((m) => m.color = GalaxyBrain.STAGES[0].color);
  }

  render(timestamp: DOMHighResTimeStamp, framebuffer: WebGLFramebuffer) {
    // Render the laser beams behind the stars.
    this.shaders.star.render(timestamp, framebuffer, this.lasers.stars);

    this.shaders.crepuscularRay.render(timestamp, framebuffer, {
      models: [this.brain],
      light: this.light,
      samples: 100,
      density: 0.5,
      weight: 5,
      decay: 0.99,
      exposure: 0.0035,
    });

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
      samples: 50,
      density: 0.35,
      weight: 5.65,
      decay: 0.99,
      exposure: 0.0035,
    });

    this.shaders.glow.render(timestamp, framebuffer, this.brain.neurons);
  }

  evolve(stage: number) {
    // It's okay to calculate rotation axis and angle from the brain
    // because all the models share the same rotation axis and angle.
    const { angle: rotationAngle, axis } = this.brain.rotation();
    let angle = rotationAngle - GalaxyBrain.STAGES[stage].angle;
    if (this.stage > stage) {
      angle *= -1;
    }

    this.models.forEach((m) => m.color = GalaxyBrain.STAGES[stage].color);

    switch (stage) {
      case 0:
        Animation.run(
          new Scale(this.brain.model, 0.5, 500),
          new FadeIn(this.skull, 1000),
          new FadeOut(this.head, 1000),
          new FadeOut(this.brain.neurons, 1000),
          ...this.lasers.beams.map((b) => new FadeOut(b, 1000)),
          new FadeOut(this.lasers.stars, 500),
          new FadeOut(this.light, 1000),
          new Rotation(this.matrices, axis, angle, 500)
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
          stage === 1
            ? new FadeOut(this.light, 1000)
            : new FadeIn(this.light, 1000),
          new FadeIn(this.head, 1000),
          new FadeOut(this.skull, 1000),
          new Rotation(this.matrices, axis, angle, 500)
        );
        break;
      case 3:
        Animation.run(
          new Scale(this.brain.model, 1 / this.brain.scaling(), 500),
          new FadeOut(this.skull, 1000),
          new FadeOut(this.brain.neurons, 1000),
          new FadeIn(this.head, 1000),
          ...this.lasers.beams.map((b) => new FadeIn(b, 500)),
          new FadeIn(this.lasers.stars, 1000),
          new FadeIn(this.light, 1000),
          new Rotation(this.matrices, axis, angle, 500)
        );
        break;
      default:
        break;
    }

    const prevStage = this.stage;
    this.stage = stage;
    return prevStage;
  }
}

export default GalaxyBrain;
