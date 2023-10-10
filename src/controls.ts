import $ from "jquery";
import { glMatrix, vec3 } from "gl-matrix";
import { MatrixController } from "@ojdom/matrix-rain";
import Matrix from "./matrix";
import GalaxyBrain from "./galaxy_brain";

const Controls = (
  $canvas: JQuery<HTMLCanvasElement>,
  $slider: JQuery<HTMLInputElement>,
  galaxyBrain: GalaxyBrain,
  matrixController: MatrixController
) => {
  const LEFT_MOUSE = 0;

  const Z_AXIS = vec3.fromValues(0, 0, 1);

  let mousePosition: vec3 | undefined;

  let mouseMoveTimestamp: DOMHighResTimeStamp | undefined;

  let wheelTimestamp: DOMHighResTimeStamp | undefined;

  const evolve = (stage: number) => {
    galaxyBrain.evolve(stage);
    $canvas.attr("class", `stage-${stage}`);

    if (stage === 3) {
      matrixController.start();
    } else {
      matrixController.stop();
    }
  };

  const coordinates = (event: JQuery.TriggeredEvent<HTMLCanvasElement>) => ({
    pageX: event.pageX || event.changedTouches?.[0].pageX,
    pageY: event.pageY || event.changedTouches?.[0].pageY,
  });

  if (window.location.hash) {
    const stage = parseInt(window.location.hash.slice(1), 10);
    if (Number.isNaN(stage)) {
      return;
    }

    $slider.val(stage);
    evolve(stage);
  }

  $canvas.on("mousedown touchstart", (event) => {
    if (event.type === "mousedown" && event.button !== LEFT_MOUSE) {
      return;
    }

    const { pageX, pageY } = coordinates(event);
    if (pageX && pageY) {
      mousePosition = vec3.fromValues(pageX, pageY, 0);
    }
  });

  $canvas.on("mousemove touchmove", (event) => {
    if (
      !mousePosition ||
      (event.type === "mousemove" && event.button !== LEFT_MOUSE) ||
      mouseMoveTimestamp === event.timeStamp
    ) {
      return;
    }

    const elapsedTimestamp = event.timeStamp - (mouseMoveTimestamp ?? 0);
    mouseMoveTimestamp = event.timeStamp;

    const { pageX, pageY } = coordinates(event);
    if (pageX && pageY) {
      const currentMousePosition = vec3.fromValues(-pageX, pageY, 0);
      const mouseMovement = vec3.subtract(
        vec3.create(),
        mousePosition,
        currentMousePosition
      );

      const axis = vec3.cross(vec3.create(), mouseMovement, Z_AXIS);
      const angle = vec3.length(mouseMovement) / elapsedTimestamp;
      Matrix.rotateView(axis, angle);

      mousePosition = currentMousePosition;
    }
  });

  $canvas.on("mouseup touchend", (event) => {
    if (event.type === "mouseup" && event.button !== LEFT_MOUSE) {
      return;
    }

    mousePosition = undefined;
  });

  $canvas.on("wheel", (event) => {
    if (wheelTimestamp !== event.timeStamp) {
      const elapsedTimestamp = event.timeStamp - (wheelTimestamp ?? 0);
      wheelTimestamp = event.timeStamp;

      const delta = (<WheelEvent>event.originalEvent).deltaY / elapsedTimestamp;
      Matrix.zoom(glMatrix.toRadian(delta));
    }
  });

  $slider.on("change", (event) => {
    const stage = parseInt(event.target.value, 10);
    if (Number.isNaN(stage)) {
      return;
    }

    window.location.hash = event.target.value;
    evolve(stage);
  });

  $(window).on("resize", () => {
    window.location.reload();
  });
};

export default Controls;
