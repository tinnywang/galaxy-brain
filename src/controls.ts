import { glMatrix, vec2, vec3 } from "gl-matrix";

class Controls {
  private mouseDown?: vec2;

  private mouseUp?: vec2;

  private axis?: vec3;

  private angle?: number;

  constructor(canvas: JQuery<HTMLCanvasElement>, gl: WebGL2RenderingContext) {
    canvas.on("mousedown", (event) => {
      this.mouseDown = vec2.fromValues(event.pageX, event.pageY);
    });

    canvas.on("mouseup", (event) => {
      if (!this.mouseDown) {
        return;
      }

      this.mouseUp = vec2.fromValues(event.pageX, event.pageY);

      const mouseMovement = vec2.subtract(
        vec2.create(),
        this.mouseDown,
        this.mouseUp
      );

      let axis = vec2.rotate(
        vec2.create(),
        mouseMovement,
        vec2.create(),
        glMatrix.toRadian(90)
      );
      axis = vec2.normalize(axis, axis);

      this.axis = vec3.fromValues(axis[0], axis[1], 0);
      this.angle =
        vec2.length(mouseMovement) /
        vec2.length(
          vec2.fromValues(gl.drawingBufferWidth, gl.drawingBufferHeight)
        );
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
