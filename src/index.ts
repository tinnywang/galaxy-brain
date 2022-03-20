import $ from "jquery";
import initGL from "./gl";
import { Cube, Cube2 } from "./renderables/cube";
import { TransparentShader } from "./shaders/transparent/shader";

$(() => {
  const $canvas: JQuery<HTMLCanvasElement> = $("canvas");
  const canvas = $canvas[0];
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;

  try {
    const gl = initGL(canvas);
    const shader = new TransparentShader(gl);

    const path =
      "https://raw.githubusercontent.com/tinnywang/rubiks-cube/master/models/rubiks-cube.json";
    $.get(path, (data: string) => {
      const cube = JSON.parse(data)[0];
      const renderables = [new Cube(gl, cube), new Cube2(gl, cube)];

      const render = (_: DOMHighResTimeStamp) => {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        shader.render(...renderables);
        requestAnimationFrame(render);
      };

      render(performance.now());
    });
  } catch (e) {
    console.error(e);
  }
});