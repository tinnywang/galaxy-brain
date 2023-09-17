import { glMatrix, vec3 } from "gl-matrix";
import Matrix from "./matrix";
import GalaxyBrain from "./galaxy_brain";

const Controls = (
  canvas: JQuery<HTMLCanvasElement>,
  slider: JQuery<HTMLInputElement>,
  galaxyBrain: GalaxyBrain
) => {
  const LEFT_MOUSE = 0;

  const Z_AXIS = vec3.fromValues(0, 0, 1);

  let mousePosition: vec3 | undefined;

  let mouseMoveTimestamp: DOMHighResTimeStamp | undefined;

  let wheelTimestamp: DOMHighResTimeStamp | undefined;

  canvas.on("mousedown", (event) => {
    if (event.button !== LEFT_MOUSE) {
      return;
    }

    mousePosition = vec3.fromValues(event.pageX, event.pageY, 0);
  });

  canvas.on("mousemove", (event) => {
    if (
      !mousePosition ||
      event.button !== LEFT_MOUSE ||
      mouseMoveTimestamp === event.timeStamp
    ) {
      return;
    }

    const elapsedTimestamp = event.timeStamp - (mouseMoveTimestamp ?? 0);
    mouseMoveTimestamp = event.timeStamp;

    const currentMousePosition = vec3.fromValues(-event.pageX, event.pageY, 0);
    const mouseMovement = vec3.subtract(
      vec3.create(),
      mousePosition,
      currentMousePosition
    );

    const axis = vec3.cross(vec3.create(), mouseMovement, Z_AXIS);
    const angle = vec3.length(mouseMovement) / elapsedTimestamp;
    Matrix.rotateView(axis, angle);

    mousePosition = currentMousePosition;
  });

  canvas.on("mouseup", (event) => {
    if (event.button !== LEFT_MOUSE) {
      return;
    }

    mousePosition = undefined;
  });

  canvas.on("wheel", (event) => {
    if (wheelTimestamp !== event.timeStamp) {
      const elapsedTimestamp = event.timeStamp - (wheelTimestamp ?? 0);
      wheelTimestamp = event.timeStamp;

      const delta = (<WheelEvent>event.originalEvent).deltaY / elapsedTimestamp;
      Matrix.zoom(glMatrix.toRadian(delta));
    }
  });

  slider.on("change", (event) => {
    const stage = parseInt(event.target.value, 10);
    if (Number.isNaN(stage)) {
      return;
    }

    galaxyBrain.evolve(stage);
  });
};

export default Controls;
