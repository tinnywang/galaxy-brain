import $ from "jquery";
import WebGL2 from "./gl";
import { Cube, Cube2, Cube3 } from "./renderables/cube";
import { FlatShader } from "./shaders/flat/shader";
import { TransparentShader } from "./shaders/transparent/shader";

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

    const flatShader = new FlatShader(gl);
    const transparentShader = new TransparentShader(gl, {
      opaque: { depthTexture, colorTexture },
    });

    const path =
      "https://raw.githubusercontent.com/tinnywang/rubiks-cube/master/models/rubiks-cube.json";

    $.get(path, (data: string) => {
      const cube = JSON.parse(data)[0];

      const render = (_: DOMHighResTimeStamp) => {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        flatShader.render(framebuffer, new Cube(gl, cube), new Cube3(gl, cube));
        transparentShader.render(framebuffer, new Cube2(gl, cube));

        gl.bindFramebuffer(gl.READ_FRAMEBUFFER, framebuffer);
        gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);

        gl.disable(gl.BLEND);
        gl.blitFramebuffer(
          0,
          0,
          gl.drawingBufferWidth,
          gl.drawingBufferHeight,
          0,
          0,
          gl.drawingBufferWidth,
          gl.drawingBufferHeight,
          gl.COLOR_BUFFER_BIT,
          gl.NEAREST
        );

        gl.flush();
        requestAnimationFrame(render);
      };

      render(performance.now());
    });
  } catch (e) {
    console.error(e);
  }
});
