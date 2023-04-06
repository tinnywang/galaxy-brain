import { glMatrix, vec2, vec3 } from "gl-matrix";

class Controls {
  private mousePosition?: vec2;

  private axis?: vec3;

  private angle = 0;

  constructor(canvas: JQuery<HTMLCanvasElement>) {
    canvas.on("mousedown", (event) => {
      this.mousePosition = vec2.fromValues(event.pageX, event.pageY);
    });

    canvas.on("mousemove", (event) => {
      if (!this.mousePosition) {
        return;
      }

      const currentMousePosition = vec2.fromValues(event.pageX, event.pageY);
      const mouseMovement = vec2.subtract(
        vec2.create(),
        currentMousePosition,
        this.mousePosition,
      );

      let axis = vec2.rotate(
        vec2.create(),
        mouseMovement,
        vec2.create(),
        glMatrix.toRadian(90)
      );
      axis = vec2.normalize(axis, axis);

      this.axis = vec3.fromValues(axis[0], -axis[1], 0);
      this.angle = vec2.length(mouseMovement);
      this.mousePosition = currentMousePosition;
    });

    canvas.on("mouseup", () => {
      this.mousePosition = undefined;
      this.axis = undefined;
      this.angle = 0;
    });
  }

  rotation() {
    return {
      axis: this.axis,
      angle: this.angle,
    };
  }
}

export default Controls;
