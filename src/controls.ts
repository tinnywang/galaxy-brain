import { glMatrix, vec2, vec3 } from "gl-matrix";
import Matrix from "./matrix";

const Controls = (canvas: JQuery<HTMLCanvasElement>) => {
  const LEFT_MOUSE = 0;

  let mousePosition: vec2 | undefined;

  let mouseMoveTimestamp: DOMHighResTimeStamp | undefined;

  let wheelTimestamp: DOMHighResTimeStamp | undefined;

  canvas.on("mousedown", (event) => {
    if (event.button !== LEFT_MOUSE) {
      return;
    }

    mousePosition = vec2.fromValues(event.pageX, event.pageY);
  });

  canvas.on("mousemove", (event) => {
    if (
      event.button !== LEFT_MOUSE ||
      !mousePosition ||
      mouseMoveTimestamp === event.timeStamp
    ) {
      return;
    }

    const elapsedTimestamp = event.timeStamp - (mouseMoveTimestamp ?? 0);
    mouseMoveTimestamp = event.timeStamp;

    const currentMousePosition = vec2.fromValues(event.pageX, event.pageY);
    const mouseMovement = vec2.subtract(
      vec2.create(),
      currentMousePosition,
      mousePosition
    );
    mousePosition = currentMousePosition;

    const [x, y] = mouseMovement;
    const axis = vec3.normalize(vec3.create(), vec3.fromValues(y, x, 0));

    const angle = vec2.length(mouseMovement) / elapsedTimestamp;

    Matrix.rotateView(angle, axis);
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
};

export default Controls;
