import { mat4, vec3 } from "gl-matrix";
import Matrix from "./matrix";
import { ShaderLocations } from "./shaders/shader_locations";
import { Light } from "./light";

export interface LightBeamsProps {
    model?: mat4,
    color?: vec3,
    width?: number,
}

export class LightBeams {
    private static GoldenRatio = 1.618;

    private static Coordinates = [
        [1, 1, 1],
        [0, LightBeams.GoldenRatio, 1 / LightBeams.GoldenRatio],
        [1 / LightBeams.GoldenRatio, 0, LightBeams.GoldenRatio],
        [LightBeams.GoldenRatio, 1 / LightBeams.GoldenRatio, 0],
    ];

    readonly stars: Light;

    readonly color: vec3;

    readonly width: number;

    private model?: mat4;

    private verticesBuffer: WebGLBuffer | null;
    
    constructor(gl: WebGL2RenderingContext, props: LightBeamsProps) {
        this.model = props.model;
        this.color = props.color ?? vec3.fromValues(1, 1, 1);
        this.width = props.width ?? 1;

        // Generate the coordinates of a regular dodecahedron.
        // https://en.wikipedia.org/wiki/Regular_dodecahedron#Cartesian_coordinates
        const positions = LightBeams.Coordinates.flatMap((c) => {
            return this.permutate(c).map((p) => {
                const scale = Math.random() * 10 + 10;
                return vec3.scale(
                    vec3.create(),
                    vec3.fromValues(p[0], p[1], p[2]),
                    scale,
                );
            });
        });

        this.stars = new Light(gl, {
            positions,
            model: this.model,
            radius: 100,
            color: this.color,
        });

        this.verticesBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.verticesBuffer);
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array(positions.flatMap((p) => [...p])),
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

        this.stars.render(gl, locations);
    }

    permutate(vertex: number[]): number[][] {
        if (vertex.length === 0) {
            return [[]]
        }

        return this.permutate(vertex.slice(1)).flatMap((v) => {
            const permutations = [[vertex[0], ...v]];
            if (vertex[0] !== 0) {
                permutations.push([-vertex[0], ...v]);
            }

            return permutations;
        });
    }
}