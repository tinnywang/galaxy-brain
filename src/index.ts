import $ from "jquery";
import WebGL2 from "./gl";
import { Cube, Cube2 } from "./renderables/cube";
import { BlinnPhongShader } from "./shaders/blinn_phong/shader";
import { TransparentShader } from "./shaders/transparent/shader";
import { FXAA } from "./shaders/fxaa/shader";

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

    const blinnPhongShader = new BlinnPhongShader(gl);
    const transparentShader = new TransparentShader(gl, {
      opaqueDepthTexture: depthTexture,
    });
    const fxaa = new FXAA(gl);

    const path =
      "https://raw.githubusercontent.com/tinnywang/rubiks-cube/master/models/rubiks-cube.json";

    $.get(path, (data: string) => {
      const cube = JSON.parse(data)[0];

      const render = (_: DOMHighResTimeStamp) => {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        blinnPhongShader.render(framebuffer, new Cube(gl, cube));
        transparentShader.render(framebuffer, new Cube2(gl, cube));

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
