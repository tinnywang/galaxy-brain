import { mat4, vec3 } from "gl-matrix";
import Matrix from "./matrix";
import { ShaderLocations } from "./shaders/shader_locations";

export interface LightProps {
  positions: vec3[];
  model?: mat4;
  color?: vec3;
  alpha?: number;
  power?: number;
  radius?: number;
}

export class Light {
  readonly positions: vec3[];

  readonly color: vec3;

  readonly power: number;

  readonly radius: number;

  private model?: mat4;

  private verticesBuffer: WebGLBuffer | null;

  alpha: number;


  constructor(gl: WebGL2RenderingContext, props: LightProps) {
    this.positions = props.positions;
    this.color = props.color ?? vec3.fromValues(1, 1, 1);
    this.alpha = props.alpha ?? 1;
    this.power = props.power ?? 1;
    this.radius = props.radius ?? 1;
    this.model = props.model;

    this.verticesBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.verticesBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array(this.positions.flatMap((p) => [...p])),
      gl.STATIC_DRAW
    );
  }

  render(gl: WebGL2RenderingContext, locations: ShaderLocations) {
    if (this.alpha === 0) {
      return;
    }

    const vertexPosition = locations.getAttribute("vertexPosition");
    if (vertexPosition !== null) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.verticesBuffer);
      gl.vertexAttribPointer(vertexPosition, 3, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(vertexPosition);
    }

    gl.uniformMatrix4fv(
      locations.getUniform("modelViewMatrix"),
      false,
      Matrix.modelView(this.model)
    );
    gl.uniformMatrix4fv(
      locations.getUniform("projectionMatrix"),
      false,
      Matrix.projection(gl)
    );

    gl.uniform1f(locations.getUniform("radius"), this.radius);
    gl.uniform4fv(locations.getUniform("color"), [...this.color, this.alpha]);

    gl.drawArrays(gl.POINTS, 0, this.positions.length);
  }
}
