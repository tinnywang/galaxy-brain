import vertexSrc from './vertex.glsl';
import fragmentSrc from './fragment.glsl';
import { Shader } from '../shader';
import { Renderable } from '../../renderables/renderable';
import Matrix from '../../matrix';
import { vec3 } from 'gl-matrix';
import { DepthPeeling } from '../depth_peeling/shader';

export interface DepthMapProps {
    eye: vec3;
    opaqueDepthTexture: WebGLTexture;
}

export class DepthMap extends Shader {
    private depthPeeling: DepthPeeling;

    public readonly matrix: Matrix;

    constructor(gl: WebGL2RenderingContext, props: DepthMapProps) {
        super(gl, vertexSrc, fragmentSrc);

        this.depthPeeling = new DepthPeeling(this, {
            opaqueDepthTexture: props.opaqueDepthTexture,
            iterations: 4,
        });

        this.matrix = new Matrix(gl, { eye: props.eye });

        this.locations.setAttribute('normal');
        this.locations.setAttribute('vertexPosition');
        this.locations.setUniform('modelViewMatrix');
        this.locations.setUniform('projectionMatrix');
    }

    render(...renderables: Renderable[]) {
        this.gl.useProgram(this.program);

        this.gl.uniformMatrix4fv(this.locations.getUniform('modelViewMatrix'), false, this.matrix.modelView);
        this.gl.uniformMatrix4fv(this.locations.getUniform('projectionMatrix'), false, this.matrix.projection);

        this.depthPeeling.depthPeel((r: Renderable, _: number) => {
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, r.buffer.vertices);
            const vertexPosition = this.locations.getAttribute('vertexPosition');
            this.gl.vertexAttribPointer(vertexPosition, 3, this.gl.FLOAT, false, 0, 0);
            this.gl.enableVertexAttribArray(vertexPosition);

            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, r.buffer.normals);
            const normal = this.locations.getAttribute('normal');
            this.gl.vertexAttribPointer(normal, 3, this.gl.FLOAT, false, 0, 0);
            this.gl.enableVertexAttribArray(normal);

            let offset = 0
            this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, r.buffer.faces);
            r.object.faces.forEach((f) => {
                this.gl.drawElements(this.gl.TRIANGLES, f.vertex_indices.length, this.gl.UNSIGNED_SHORT, offset);
                // Offset must be a multiple of 2 since an unsigned short is 2 bytes.
                offset += f.vertex_indices.length * 2
            })
        }, renderables);
    }

    public depthTexture(i: number): WebGLTexture | null {
        return this.depthPeeling.colorTextures.at(i - 2) || null;
    }
}
