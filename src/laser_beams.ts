import { glMatrix, mat4, vec3, quat } from "gl-matrix";
import Matrix from "./matrix";
import { ShaderLocations } from "./shaders/shader_locations";

export interface LaserBeamsProps {
    model?: mat4,
    color?: vec3,
}

export class LaserBeams {
    private static GoldenRatio = 0.61803398875;

    private static Coordinates = [
        [1, 1, 1],
        [0, LaserBeams.GoldenRatio, 1 / LaserBeams.GoldenRatio],
        [1 / LaserBeams.GoldenRatio, 0, LaserBeams.GoldenRatio],
        [LaserBeams.GoldenRatio, 1 / LaserBeams.GoldenRatio, 0],
    ];

    readonly color: vec3;

    private model?: mat4;

    private verticesBuffer: WebGLBuffer | null;

    private vertices: vec3[];

    constructor(gl: WebGL2RenderingContext, props: LaserBeamsProps) {
        this.model = props.model;
        this.color = props.color ?? vec3.fromValues(1, 1, 1);

        // Generate the coordinates of a regular dodecahedron.
        // https://en.wikipedia.org/wiki/Regular_dodecahedron#Cartesian_coordinates
        const dodecahedronVertices = LaserBeams.Coordinates.flatMap((c) => {
            return this.permutate(c).map((p) => vec3.fromValues(10 * p[0], 10 * p[1], 10 * p[2]));
        });
        const coneVertices = this.cone(glMatrix.toRadian(45), 10, 1000);
        this.vertices = dodecahedronVertices.flatMap((d) => {
            const q = quat.rotationTo(quat.create(), Matrix.UP, vec3.normalize(vec3.create(), d));
            return coneVertices.map((c) => vec3.transformQuat(vec3.create(), c, q));
        });
  
        this.verticesBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.verticesBuffer);
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array(this.vertices.flatMap((v) => [v[0], v[1], v[2]])),
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
            locations.getUniform("projectionMatrix"),
            false,
            Matrix.projection(gl)
        );
        gl.uniformMatrix4fv(
            locations.getUniform("modelViewMatrix"),
            false,
            Matrix.modelView(this.model)
        );

        gl.uniform3fv(locations.getUniform("color"), vec3.fromValues(1, 1, 1));

        gl.drawArrays(gl.TRIANGLE_FAN, 0, this.vertices.length);
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

    cone(radians: number, radius: number, height: number): vec3[] {
        const vertices: vec3[] = [vec3.fromValues(0, 0, 0)];
        for (let rad = 0; rad <= glMatrix.toRadian(360); rad += radians) {
            vertices.push(vec3.fromValues(radius * Math.cos(rad), height, radius * Math.sin(rad)));
        }

        return vertices;
    }
}