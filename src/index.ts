import { vec3 } from "gl-matrix";
import $ from "jquery";
import WebGL2 from "./gl";
// import { Cube } from "./renderables/cube";
import { Teapot } from "./renderables/teapot";
// import { BlinnPhongShader } from "./shaders/blinn_phong/shader";
import { SubsurfaceScattering } from "./shaders/subsurface_scattering/shader";
import { FXAA } from "./shaders/fxaa/shader";
// import { TransparentShader } from "./shaders/transparent/shader";

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
    gl.bindTexture(gl.TEXTURE_2D, depthTexture);
    gl.framebufferTexture2D(
      gl.DRAW_FRAMEBUFFER,
      gl.DEPTH_ATTACHMENT,
      gl.TEXTURE_2D,
      depthTexture,
      0
    );

    const colorTexture = WebGL2.createColorTextures(gl, 1)[0];
    gl.bindTexture(gl.TEXTURE_2D, colorTexture);
    gl.framebufferTexture2D(
      gl.DRAW_FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      colorTexture,
      0
    );

    const light = {
      position: vec3.fromValues(0, 0, -10),
      color: vec3.fromValues(0, 0.5, 1),
      power: 40,
    };

    // const blinnPhongShader = new BlinnPhongShader(gl, lights);
    // const transparentShader = new TransparentShader(gl, { opaqueDepthTexture: depthTexture });
    const subsurfaceScattering = new SubsurfaceScattering(gl, {
      light,
      opaqueDepthTexture: depthTexture,
    });
    const fxaa = new FXAA(gl);

    const path = //"https://raw.githubusercontent.com/tinnywang/rubiks-cube/master/models/rubiks-cube.json";
      "https://gist.githubusercontent.com/tinnywang/58bda00c65fd7b14d0d15ea1c7a022db/raw/2285fe9f55a815bc4856e73334b90c64128aedc5/teapot.json";

    $.get(path, (data: string) => {
      const teapot = JSON.parse(data)[0];

      const render = (_: DOMHighResTimeStamp) => {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // blinnPhongShader.render(framebuffer, new Teapot(gl, teapot));
        subsurfaceScattering.render(null, new Teapot(gl, teapot));
        // transparentShader.render(framebuffer, new Teapot(gl, teapot));

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
