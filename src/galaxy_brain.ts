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
import { Model } from "./models/model";

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

  private stage = 0;

  private animations: Animation<Model | Light>[] = [];

  constructor(gl: WebGL2RenderingContext, shaders: Shaders) {
    this.shaders = shaders;

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
    this.head.alpha = 0;

    this.skull = new Skull(gl, model);

    this.brain = new Brain(gl, model);
    this.brain.scale(0.5);

    this.lasers = new Laser(gl, model);
  }

  render(timestamp: DOMHighResTimeStamp, framebuffer: WebGLFramebuffer) {
    // Render the laser beams behind the stars.
    // this.shaders.star.render(timestamp, framebuffer, this.lasers.stars);

    this.shaders.transparent.render(
      timestamp,
      framebuffer,
      this.head,
      this.skull,
      this.brain
    );

    /*
    this.shaders.crepuscularRay.render(timestamp, framebuffer, {
      models: this.lasers.beams,
      light: this.light,
    });

    this.shaders.glow.render(timestamp, framebuffer, this.brain.neurons);
    */
  }

  evolve(stage: number) {
    this.animations.forEach((a) => a.cancel());
    this.animations = [];

    switch (stage) {
      case 0:
        this.animations.push(
          new Scale(this.brain, 0.5, 500),
          new FadeIn(this.skull, 2500),
          new FadeOut(this.head, 2500)
        );
        break;
      default:
        if (this.stage === 0) {
          this.animations.push(
            new Scale(this.brain, 1 / this.brain.getScale(), 500),
            new FadeIn(this.head, 2500),
            new FadeOut(this.skull, 2500)
          );
        }
    }

    this.stage = stage;
  }
}

export default GalaxyBrain;
