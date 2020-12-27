import $ from "jquery";
import initGL from "./gl";
import { Object } from "./object";
import { Cube } from "./renderables/cube";
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
      const objects: Array<Object> = JSON.parse(data);

      const renderables = objects.map((o) => {
        switch (o.name) {
          case "Cube":
            return new Cube(gl, shader, o);
          default:
            throw new Error(`Unknown object "${o.name}"`);
        }
      });

      const render = (_: number) => {
        renderables.forEach((r) => r.render());
        requestAnimationFrame(render);
      };
      render(performance.now());
    });
  } catch (e) {
    console.error(e);
  }
});
