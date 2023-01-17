import { glMatrix, mat4, vec3 } from "gl-matrix";
import Matrix from "./matrix";

export interface LightProps {
  position: vec3;
  color?: vec3;
  power?: number;
  radius?: number;
  degrees?: number;
}

export class Light {
  private gl: WebGL2RenderingContext;

  readonly position: vec3;

  readonly color: vec3;

  readonly power: number;

  readonly radius: number;

  readonly matrix: Matrix;

  readonly vertices: number[];

  readonly verticesBuffer: WebGLBuffer | null;

  constructor(gl: WebGL2RenderingContext, props: LightProps) {
    this.gl = gl;

    this.position = props.position;
    this.color = props.color ?? vec3.fromValues(1, 1, 1);
    this.power = props.power ?? 1;
    this.radius = props.radius ?? 1;
    this.matrix = new Matrix(gl, mat4.fromTranslation(mat4.create(), this.position));

    const degrees = props.degrees ?? 20;
    this.vertices = this.getVertices(degrees);

    this.verticesBuffer = gl.createBuffer();
    gl.bindBuffer(this.gl.ARRAY_BUFFER, this.verticesBuffer);
    gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.STATIC_DRAW);
  }

  // Points on a circle are given by the equation (x, y) = (rsin(θ), rcos(θ)).
  // (0, 0) is the center of the circle and is the shared vertex in the triangle fan.
  private getVertices(degrees: number): number[] {
    const vertices = [0, 0];
    for (let d = 0; d <= 360; d += degrees) {
      vertices.push(
        this.radius * Math.sin(glMatrix.toRadian(d)),
        this.radius * Math.cos(glMatrix.toRadian(d)),
      );
    }

    return vertices;
  }
}
