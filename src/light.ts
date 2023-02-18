import { mat4, vec3 } from "gl-matrix";
import Matrix from "./matrix";
import { ShaderLocations } from "./shaders/shader_locations";

export interface LightProps {
  position: vec3;
  color?: vec3;
  power?: number;
  radius?: number;
  degrees?: number;
}

export class Light {
  readonly position: vec3;

  readonly color: vec3;

  readonly power: number;

  readonly radius: number;

  readonly matrix: Matrix;

  readonly vertices: number[];

  readonly verticesBuffer: WebGLBuffer | null;

  constructor(gl: WebGL2RenderingContext, props: LightProps) {
    this.position = props.position;
    this.color = props.color ?? vec3.fromValues(1, 1, 1);
    this.power = props.power ?? 1;
    this.radius = props.radius ?? 1;
    this.matrix = new Matrix(
      gl,
      mat4.fromTranslation(mat4.create(), this.position)
    );

    this.vertices = [...this.position];

    this.verticesBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.verticesBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array(this.vertices),
      gl.STATIC_DRAW
    );
  }

  render(gl: WebGL2RenderingContext, locations: ShaderLocations) {
    const vertexPosition = locations.getAttribute("vertexPosition");
    if (vertexPosition !== null) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.verticesBuffer);
      gl.vertexAttribPointer(vertexPosition, 3, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(vertexPosition);
    }

    gl.uniformMatrix4fv(
      locations.getUniform("modelViewMatrix"),
      false,
      this.matrix.modelView
    );
    gl.uniformMatrix4fv(
      locations.getUniform("projectionMatrix"),
      false,
      this.matrix.projection
    );

    gl.uniform1f(locations.getUniform("radius"), this.radius);
    gl.uniform3fv(locations.getUniform("color"), this.color);

    gl.drawArrays(gl.POINTS, 0, this.vertices.length);
  }
}
