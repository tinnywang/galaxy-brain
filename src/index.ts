// import { vec3 } from "gl-matrix";
import $ from "jquery";
import WebGL2 from "./gl";
import { Teapot } from "./renderables/teapot";
// import { BlinnPhongShader } from "./shaders/blinn_phong/shader";
import { TransparentShader } from "./shaders/transparent/shader";
import { FXAA } from "./shaders/fxaa/shader";
import { vec3 } from "gl-matrix";

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

    /*
    const lights = [
      {
        position: vec3.fromValues(-10, 10, -10),
        color: vec3.fromValues(1, 1, 1),
        power: 40,
      },
      {
        position: vec3.fromValues(10, 10, -10),
        color: vec3.fromValues(1, 1, 1),
        power: 40,
      },
    ];
    */

    // const blinnPhongShader = new BlinnPhongShader(gl, lights);
    const transparentShader = new TransparentShader(gl, {
      opaqueDepthTexture: depthTexture,
      fresnelColor: vec3.fromValues(1, 1, 1),
      fresnelHueShift: -20,
      fresnelExponent: 3.5,
    });
    const fxaa = new FXAA(gl);

    const path = "https://gist.githubusercontent.com/tinnywang/58bda00c65fd7b14d0d15ea1c7a022db/raw/e6147607586052300501fa6be58fc80c51ac6d15/teapot.json";

    $.get(path, (data: string) => {
      const teapot = JSON.parse(data)[0];

      const render = (_: DOMHighResTimeStamp) => {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // blinnPhongShader.render(framebuffer, new Teapot(gl, teapot));
        transparentShader.render(framebuffer, new Teapot(gl, teapot));

        gl.bindFramebuffer(gl.READ_FRAMEBUFFER, framebuffer);
        gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);

        gl.disable(gl.BLEND);

        // Post-processing effects.
        fxaa.render(colorTexture);

        gl.flush();
        requestAnimationFrame(render);
      };

      render(performance.now());
    });
  } catch (e) {
    console.error(e);
  }
});
