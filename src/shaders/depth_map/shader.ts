import vertexSrc from './vertex.glsl';
import fragmentSrc from './fragment.glsl';
import { Shader } from '../shader';
import { Renderable } from '../../renderables/renderable';
import Matrix from '../../matrix';
import { vec3 } from 'gl-matrix';
import WebGL2 from '../../gl';

export interface DepthMapProps {
    eye: vec3;
    opaqueDepthTexture: WebGLTexture;
}

export class DepthMap extends Shader {
    private props: DepthMapProps;

    public readonly matrix: Matrix;
    public readonly depthTexture: WebGLTexture;

    constructor(gl: WebGL2RenderingContext, props: DepthMapProps) {
        super(gl, vertexSrc, fragmentSrc);

        this.props = props;

        this.matrix = new Matrix(gl, { eye: props.eye });

        this.depthTexture = WebGL2.createDepthTextures(this.gl, 1)[0];

        this.locations.setAttribute('vertexPosition');
        this.locations.setUniform('modelViewMatrix');
        this.locations.setUniform('projectionMatrix');
        this.locations.setUniform('opaqueDepthTexture');
    }

    render(drawFramebuffer: WebGLFramebuffer | null, ...renderables: Renderable[]) {
        super.render(drawFramebuffer, ...renderables);

        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.depthFunc(this.gl.LEQUAL);
        this.gl.enable(this.gl.CULL_FACE);
        this.gl.cullFace(this.gl.BACK);

        this.gl.bindFramebuffer(this.gl.DRAW_FRAMEBUFFER, drawFramebuffer);

        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.depthTexture);
        this.gl.framebufferTexture2D(this.gl.DRAW_FRAMEBUFFER, this.gl.DEPTH_ATTACHMENT, this.gl.TEXTURE_2D, this.depthTexture, 0);

        this.gl.uniformMatrix4fv(this.locations.getUniform('modelViewMatrix'), false, this.matrix.modelView);
        this.gl.uniformMatrix4fv(this.locations.getUniform('projectionMatrix'), false, this.matrix.projection);

        this.gl.activeTexture(this.gl.TEXTURE1);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.props.opaqueDepthTexture);
        this.gl.uniform1i(this.locations.getUniform('opaqueDepthTexture'), 1);

        renderables.forEach((r) => {
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, r.buffer.vertices);
            const vertexPosition = this.locations.getAttribute('vertexPosition');
            this.gl.vertexAttribPointer(vertexPosition, 3, this.gl.FLOAT, false, 0, 0);
            this.gl.enableVertexAttribArray(vertexPosition);

            let offset = 0
            this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, r.buffer.faces);
            r.object.faces.forEach((f) => {
                this.gl.drawElements(this.gl.TRIANGLES, f.vertex_indices.length, this.gl.UNSIGNED_SHORT, offset);
                // Offset must be a multiple of 2 since an unsigned short is 2 bytes.
                offset += f.vertex_indices.length * 2
            })
        });
    }
}
