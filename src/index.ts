import $ from "jquery";
import { vec3 } from "gl-matrix";
import WebGL2 from "./gl";
import { Teapot } from "./models/teapot";
import { CrepuscularRay } from "./shaders/crepuscular_ray/shader";
import { TransparentShader } from "./shaders/transparent/shader";
import { FXAA } from "./shaders/fxaa/shader";
import { Light } from "./light";
import { Glow } from "./shaders/glow/shader";
import { Star } from "./shaders/star/shader";
import Matrix from "./matrix";

$(() => {
  const $canvas: JQuery<HTMLCanvasElement> = $("canvas");
  const canvas = $canvas[0];
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;

  try {
    const gl = WebGL2.renderingContext(canvas);

    const framebuffer = gl.createFramebuffer();
    if (framebuffer === null) {
      throw new Error("Unable to create framebuffer.");
    }
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, framebuffer);

    const depthTexture = WebGL2.createDepthTextures(gl, 1)[0];
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, depthTexture);
    gl.framebufferTexture2D(
      gl.DRAW_FRAMEBUFFER,
      gl.DEPTH_ATTACHMENT,
      gl.TEXTURE_2D,
      depthTexture,
      0
    );

    const colorTexture = WebGL2.createColorTextures(gl, 1)[0];
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, colorTexture);
    gl.framebufferTexture2D(
      gl.DRAW_FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      colorTexture,
      0
    );

    const light = new Light(gl, {
      positions: [vec3.fromValues(-10, 10, -10), vec3.fromValues(10, 0, -10)],
    });
    const glowLight = new Light(gl, {
      positions: [
        vec3.fromValues(0, 1, 0),
        vec3.fromValues(0.25, 0.35, 3.25),
        vec3.fromValues(-0.35, 0.35, 0),
      ],
      radius: 50,
      color: vec3.fromValues(1, 0, 0.5),
    });
    const starLights = [
      new Light(gl, {
        positions: [vec3.fromValues(3, 3, 0), vec3.fromValues(-3, -1, 0)],
        radius: 100,
        color: vec3.fromValues(0, 0, 1),
      }),
    ];

    const transparentShader = new TransparentShader(gl, {
      opaqueDepthTexture: depthTexture,
      fresnelColor: vec3.fromValues(1, 1, 1),
      fresnelHueShift: -20,
      fresnelExponent: 3.5,
    });
    const crepuscularRay = new CrepuscularRay(gl, {
      colorTexture,
      samples: 50,
      density: 0.35,
      weight: 5.65,
      decay: 0.99,
      exposure: 0.0035,
    });
    const glow = new Glow(gl);
    const star = new Star(gl);
    const fxaa = new FXAA(gl);

    const path =
      "https://gist.githubusercontent.com/tinnywang/58bda00c65fd7b14d0d15ea1c7a022db/raw/e6147607586052300501fa6be58fc80c51ac6d15/teapot.json";

    $.get(path, (data: string) => {
      const teapot = new Teapot(gl, JSON.parse(data)[0]);

      const render = (timestamp: DOMHighResTimeStamp) => {
        gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, framebuffer);
        gl.bindFramebuffer(gl.READ_FRAMEBUFFER, null);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        transparentShader.render(timestamp, framebuffer, teapot);
        crepuscularRay.render(timestamp, framebuffer, {
          models: [teapot],
          light,
        });
        glow.render(timestamp, framebuffer, glowLight);
        star.render(timestamp, framebuffer, ...starLights);

        gl.bindFramebuffer(gl.READ_FRAMEBUFFER, framebuffer);
        gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
        gl.disable(gl.BLEND);

        fxaa.render(timestamp, colorTexture);

        Matrix.rotateY();

        gl.flush();
        requestAnimationFrame(render);
      };

      render(performance.now());
    });
  } catch (e) {
    console.error(e);
  }
});
