import $ from "jquery";
import { vec3 } from "gl-matrix";
import { MatrixController } from "@ojdom/matrix-rain";
import WebGL2 from "./gl";
import { CrepuscularRay } from "./shaders/crepuscular_ray/shader";
import { TransparentShader } from "./shaders/transparent/shader";
import { FXAA } from "./shaders/fxaa/shader";
import { Glow } from "./shaders/glow/shader";
import Controls from "./controls";
import GalaxyBrain from "./galaxy_brain";
import { AlphaMask } from "./shaders/alpha_mask/shader";
import { Star } from "./shaders/star/shader";

$(() => {
  const $canvas: JQuery<HTMLCanvasElement> = $("canvas#galaxy-brain");
  const $slider: JQuery<HTMLInputElement> = $("input");

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

    const alphaMask = new AlphaMask(gl, colorTexture);
    const transparent = new TransparentShader(gl, {
      alphaMaskTexture: alphaMask.texture,
      opaqueDepthTexture: depthTexture,
      fresnelColor: vec3.fromValues(1, 1, 1),
      fresnelHueShift: -20,
      fresnelExponent: 3.5,
    });
    const crepuscularRay = new CrepuscularRay(gl, colorTexture);
    const star = new Star(gl);
    const glow = new Glow(gl);
    const fxaa = new FXAA(gl);
    const galaxyBrain = new GalaxyBrain(gl, {
      alphaMask,
      transparent,
      crepuscularRay,
      star,
      glow,
    });

    const $matrixRain: JQuery<HTMLCanvasElement> = $("canvas#matrix-rain");
    const matrixController = new MatrixController(
      {
        animationSpeed: 10,
        chars: "01",
        colors: {
          background: "rgb(0,15,56)",
          primary: "rgb(10,47,153)",
          flashed: "rgb(10,47,153)",
        },
        fontFamily: "Share Tech Mono",
        fontSize: 40,
      },
      $matrixRain[0]
    );

    Controls($canvas, $slider, galaxyBrain, matrixController);

    const render = (timestamp: DOMHighResTimeStamp) => {
      gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, framebuffer);
      gl.bindFramebuffer(gl.READ_FRAMEBUFFER, null);

      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      galaxyBrain.render(timestamp, framebuffer);

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
