import { glMatrix, vec3, quat } from "gl-matrix";
import Matrix from "./matrix";

const Controls = (canvas: JQuery<HTMLCanvasElement>) => {
  const LEFT_MOUSE = 0;

  const Z_AXIS = vec3.fromValues(0, 0, 1);

  let mousePosition: vec3 | undefined;

  let mouseMoveTimestamp: DOMHighResTimeStamp | undefined;

  let wheelTimestamp: DOMHighResTimeStamp | undefined;

  let orientationQuat = quat.create();

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

    let axis = vec3.cross(vec3.create(), mouseMovement, Z_AXIS);
    axis = vec3.transformQuat(axis, axis, orientationQuat);

    const angle = vec3.length(mouseMovement) / elapsedTimestamp;

    orientationQuat = quat.multiply(
      orientationQuat,
      Matrix.rotateView(axis, angle),
      orientationQuat
    );
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
};

export default Controls;
