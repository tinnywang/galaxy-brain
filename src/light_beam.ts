import { mat4, vec3 } from "gl-matrix";
import Matrix from "./matrix";
import { ShaderLocations } from "./shaders/shader_locations";

export interface LightBeamProps {
    position: vec3,
    normal: vec3,
    model?: mat4,
    color?: vec3,
    width?: number,
}

export class LightBeam {
    readonly color: vec3;

    readonly width: number;

    private model?: mat4;

    private verticesBuffer: WebGLBuffer | null;

    constructor(gl: WebGL2RenderingContext, props: LightBeamProps) {
        this.model = props.model;
        this.color = props.color ?? vec3.fromValues(1, 1, 1);
        this.width = props.width ?? 1;

        const start = props.position;
        const end = vec3.add(
            vec3.create(),
            start,
            vec3.scale(
                vec3.create(),
                props.normal,
                1000,
            ),
        );

        this.verticesBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.verticesBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([...start, ...end]), gl.STATIC_DRAW);
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
            Matrix.modelView(this.model)
        );
        gl.uniformMatrix4fv(
            locations.getUniform("projectionMatrix"),
            false,
            Matrix.projection(gl)
        );

        gl.uniform1f(locations.getUniform("width"), this.width);
        gl.uniform3fv(locations.getUniform("color"), this.color);

        gl.lineWidth(this.width);
        gl.drawArrays(gl.LINES, 0, 2);
    }
}