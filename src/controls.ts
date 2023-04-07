import { glMatrix, vec2, vec3 } from "gl-matrix";
import Matrix from "./matrix";

const Controls = (canvas: JQuery<HTMLCanvasElement>) => {
  let mousePosition: vec2 | undefined;

  let mouseMoveTimestamp: DOMHighResTimeStamp | undefined;

  let wheelTimestamp: DOMHighResTimeStamp | undefined;

  canvas.on("mousedown", (event) => {
    mousePosition = vec2.fromValues(event.pageX, event.pageY);
  });

  canvas.on("mousemove", (event) => {
    if (!mousePosition) {
      return;
    }

    const currentMousePosition = vec2.fromValues(event.pageX, event.pageY);
    const mouseMovement = vec2.subtract(
      vec2.create(),
      currentMousePosition,
      mousePosition
    );
    mousePosition = currentMousePosition;

    let axis = vec2.rotate(
      vec2.create(),
      mouseMovement,
      vec2.create(),
      glMatrix.toRadian(90)
    );
    axis = vec2.normalize(axis, axis);

    const rotationAxis = vec3.fromValues(axis[0], -axis[1], 0);

    if (mouseMoveTimestamp !== event.timeStamp) {
      const elapsedTimestamp = event.timeStamp - (mouseMoveTimestamp ?? 0);
      mouseMoveTimestamp = event.timeStamp;

      const angle = vec2.length(mouseMovement) / elapsedTimestamp;
      Matrix.rotateView(angle, rotationAxis);
    }
  });

  canvas.on("mouseup", () => {
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
