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
import { AlphaMask } from "./shaders/alpha_mask/shader";

interface Shaders {
  alphaMask: AlphaMask;
  transparent: TransparentShader;
  crepuscularRay: CrepuscularRay;
  star: Star;
  glow: Glow;
}

interface Stage {
  angle: number;
  color: {
    primary: vec3;
    secondary: vec3;
    highlight?: vec3;
  };
}

class GalaxyBrain {
  readonly head: Head;

  readonly skull: Skull;

  readonly brain: Brain;

  readonly lasers: Laser;

  readonly brainLight: Light;

  readonly headLight: Light;

  private readonly shaders: Shaders;

  private matrices: mat4[];

  private stage = 0;

  private static readonly STAGES: { [stage: number]: Stage } = {
    0: {
      angle: glMatrix.toRadian(-90),
      color: {
        primary: vec3.fromValues(63 / 255, 108 / 255, 249 / 255),
        secondary: vec3.fromValues(0 / 255, 128 / 255, 201 / 255),
      },
    },
    1: {
      angle: glMatrix.toRadian(90),
      color: {
        primary: vec3.fromValues(28 / 255, 50 / 255, 159 / 255),
        secondary: vec3.fromValues(228 / 255, 226 / 266, 255 / 255),
        highlight: vec3.fromValues(255 / 255, 0, 128 / 255),
      },
    },
    2: {
      angle: glMatrix.toRadian(90),
      color: {
        primary: vec3.fromValues(141 / 255, 26 / 255, 7 / 255),
        secondary: vec3.fromValues(255 / 255, 242 / 255, 237 / 255),
        highlight: vec3.fromValues(250 / 255, 255 / 255, 179 / 255),
      },
    },
    3: {
      angle: glMatrix.toRadian(210),
      color: {
        primary: vec3.fromValues(0, 31 / 255, 121 / 225),
        secondary: vec3.fromValues(86 / 255, 240 / 255, 255 / 255),
      },
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

    this.lasers = new Laser(gl, GalaxyBrain.STAGES[3].color.secondary, model);
    this.lasers.beams.forEach((b) => {
      b.alpha = 0;
    });
    this.lasers.stars.alpha = 0;

    this.brainLight = new Light(gl, {
      positions: [vec3.fromValues(0, 0, 0)],
      alpha: 0,
    });

    this.headLight = new Light(gl, {
      positions: [vec3.fromValues(0, 0, 0)],
    });

    this.matrices = [
      model,
      this.brain.model,
      ...this.lasers.beams.map((b) => b.model),
    ];

    const stage = GalaxyBrain.STAGES[0];
    this.head.color = stage.color.primary;
    this.skull.color = stage.color.primary;
    this.brain.color = stage.color.secondary;
  }

  render(timestamp: DOMHighResTimeStamp, framebuffer: WebGLFramebuffer) {
    this.shaders.crepuscularRay.render(timestamp, framebuffer, {
      models: [this.brain],
      light: this.brainLight,
      samples: 100,
      density: 0.5,
      weight: 5,
      decay: 0.99,
      exposure: 0.0035,
    });
    this.shaders.crepuscularRay.render(timestamp, framebuffer, {
      models: [this.head],
      light: this.headLight,
      samples: 50,
      density: 0.15,
      weight: 3,
      decay: 0.995,
      exposure: 0.0035,
    });

    this.shaders.star.render(timestamp, framebuffer, this.lasers.stars);
    this.shaders.glow.render(timestamp, framebuffer, this.brain.neurons);

    this.shaders.alphaMask.render(timestamp, framebuffer, this.brain);
    this.shaders.transparent.render(
      timestamp,
      framebuffer,
      { model: this.head },
      { model: this.brain, xray: true }
    );
    this.shaders.transparent.render(timestamp, framebuffer, {
      model: this.skull,
      xray: true,
    });

    this.shaders.crepuscularRay.render(timestamp, framebuffer, {
      models: this.lasers.beams,
      light: this.lasers.light,
      samples: 50,
      density: 0.35,
      weight: 5,
      decay: 0.99,
      exposure: 0.0035,
    });
  }

  evolve(stage: number) {
    if (this.stage === stage) {
      return;
    }

    // It's okay to calculate rotation axis and angle from the brain
    // because all the models share the same rotation axis and angle.
    const { angle: rotationAngle, axis } = this.brain.rotation();
    const s = GalaxyBrain.STAGES[stage];
    let angle = rotationAngle - s.angle;
    if (this.stage > stage) {
      angle *= -1;
    }

    this.head.color = s.color.primary;
    this.skull.color = s.color.primary;
    this.brain.color = s.color.secondary;
    this.brainLight.color = vec3.fromValues(1, 1, 1);
    if (s.color?.highlight) {
      this.brain.neurons.color = s.color.highlight;
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
          new FadeOut(this.brainLight, 1000),
          new Rotation(this.matrices, axis, angle, 500)
        );
        break;
      case 1:
      case 2:
        Animation.run(
          new Scale(this.brain.model, 1 / this.brain.scaling(), 500),
          new FadeIn(this.brain.neurons, 1000),
          ...this.lasers.beams.map((b) => new FadeOut(b, 1000)),
          new FadeOut(this.lasers.stars, 500),
          stage === 1
            ? new FadeOut(this.brainLight, 1000)
            : new FadeIn(this.brainLight, 1000),
          ...this.lasers.beams.map((b) => new FadeOut(b, 1000)),
          new FadeOut(this.lasers.stars, 500),
          new FadeIn(this.head, 1000),
          new FadeOut(this.skull, 1000),
          new Rotation(this.matrices, axis, angle, 500)
        );
        break;
      case 3:
        this.brainLight.color = s.color.secondary;
        Animation.run(
          new Scale(this.brain.model, 1 / this.brain.scaling(), 500),
          new FadeOut(this.skull, 1000),
          new FadeOut(this.brain.neurons, 1000),
          new FadeIn(this.head, 1000),
          ...this.lasers.beams.map((b) => new FadeIn(b, 1000)),
          new FadeIn(this.lasers.stars, 1000),
          new FadeIn(this.brainLight, 1000),
          new Rotation(this.matrices, axis, angle, 500)
        );
        break;
      default:
        break;
    }

    this.stage = stage;
  }
}

export default GalaxyBrain;
