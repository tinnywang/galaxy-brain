import $ from "jquery";
import { vec3 } from "gl-matrix";
import WebGL2 from "./gl";
import { CrepuscularRay } from "./shaders/crepuscular_ray/shader";
import { TransparentShader } from "./shaders/transparent/shader";
import { FXAA } from "./shaders/fxaa/shader";
import { Glow } from "./shaders/glow/shader";
import Controls from "./controls";
import { GalaxyBrain } from "./galaxy_brain";
import { Star } from "./shaders/star/shader";

$(() => {
  const $canvas: JQuery<HTMLCanvasElement> = $("canvas");
  Controls($canvas);

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
    const star = new Star(gl);
    const glow = new Glow(gl);
    const fxaa = new FXAA(gl);
    const galaxyBrain = new GalaxyBrain(gl);

    const render = (timestamp: DOMHighResTimeStamp) => {
      gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, framebuffer);
      gl.bindFramebuffer(gl.READ_FRAMEBUFFER, null);

      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      // Render the laser beams behind the stars.
      star.render(timestamp, framebuffer, galaxyBrain.lasers.stars);
      transparentShader.render(timestamp, framebuffer, galaxyBrain.head, galaxyBrain.brain);
      crepuscularRay.render(timestamp, framebuffer, {
        models: galaxyBrain.lasers.beams,
        light: galaxyBrain.light,
      });
      glow.render(timestamp, framebuffer, galaxyBrain.brain.neurons);

      gl.bindFramebuffer(gl.READ_FRAMEBUFFER, framebuffer);
      gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
      gl.disable(gl.BLEND);

      fxaa.render(timestamp, colorTexture);

      gl.flush();
      requestAnimationFrame(render);
    };

    render(performance.now());
  } catch (e) {
    console.error(e);
  }
});
