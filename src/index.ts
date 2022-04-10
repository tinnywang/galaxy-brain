import $ from "jquery";
import initGL from "./gl";
import { Cube, Cube2 } from "./renderables/cube";
import { FlatShader } from "./shaders/flat/shader";
import { TransparentShader } from "./shaders/transparent/shader";

$(() => {
  const $canvas: JQuery<HTMLCanvasElement> = $("canvas");
  const canvas = $canvas[0];
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;

  try {
    const gl = initGL(canvas);

    const framebuffer = gl.createFramebuffer();
    if (framebuffer === null) {
      throw new Error("failed to create framebuffer");
    }
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, framebuffer);

    const depthTexture = gl.createTexture();
    if (depthTexture === null) {
      throw new Error("failed to create depth texture");
    }
    gl.bindTexture(gl.TEXTURE_2D, depthTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT24, gl.drawingBufferWidth, gl.drawingBufferHeight, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_MODE, gl.NONE);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, depthTexture);
    gl.framebufferTexture2D(gl.DRAW_FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, depthTexture, 0);

    const colorTexture = gl.createTexture();
    if (colorTexture == null) {
      throw new Error("failed to create color texture");
    }

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, colorTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.drawingBufferWidth, gl.drawingBufferHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_MODE, gl.NONE);

    gl.bindTexture(gl.TEXTURE_2D, colorTexture);
    gl.framebufferTexture2D(gl.DRAW_FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, colorTexture, 0);

    const shader = new TransparentShader(gl);
    const flatShader = new FlatShader(gl);

    const path =
      "https://raw.githubusercontent.com/tinnywang/rubiks-cube/master/models/rubiks-cube.json";

    $.get(path, (data: string) => {
      const cube = JSON.parse(data)[0];
      //const renderables = [new Cube(gl, cube), nw Cube2(gl, cube)];

      const render = (_: DOMHighResTimeStamp) => {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        //shader.render(...renderables);
        flatShader.render(framebuffer, new Cube(gl, cube));

        shader.render(framebuffer, {
          depthTexture: depthTexture,
          colorTexture: colorTexture,
        }, new Cube2(gl, cube));

        gl.bindFramebuffer(gl.READ_FRAMEBUFFER, framebuffer);
        gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);

        gl.disable(gl.BLEND);
        gl.blitFramebuffer(
          0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight,
          0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight,
          gl.COLOR_BUFFER_BIT, gl.NEAREST,
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