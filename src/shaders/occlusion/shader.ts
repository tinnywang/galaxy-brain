import fragmentSrc from './fragment.glsl';
import vertexSrc from './vertex.glsl';
import { Shader } from '../shader';
import { Renderable } from '../../renderables/renderable';
import WebGL2 from '../../gl';

export interface OcclusionProps {
    scale: number;
}

export class OcclusionShader extends Shader {
    private props: OcclusionProps;

    readonly texture: WebGLTexture;

    constructor(gl: WebGL2RenderingContext, props: OcclusionProps) {
        super(gl, vertexSrc, fragmentSrc);

        this.props = props;

        this.texture = WebGL2.createColorTextures(
            gl,
            1,
            gl.drawingBufferWidth * props.scale,
            gl.drawingBufferHeight * props.scale,
        )[0];

        this.locations.setAttribute('vertexPosition');
        this.locations.setUniform('modelViewMatrix');
        this.locations.setUniform('projectionMatrix');
    }

    render(drawFramebuffer: WebGLFramebuffer, ...renderables: Renderable[]) {
        super.render(drawFramebuffer, ...renderables);

        this.gl.bindFramebuffer(this.gl.DRAW_FRAMEBUFFER, drawFramebuffer);
        this.gl.framebufferTexture2D(this.gl.DRAW_FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, this.texture, 0);
        this.gl.framebufferTexture2D(this.gl.DRAW_FRAMEBUFFER, this.gl.DEPTH_ATTACHMENT, this.gl.TEXTURE_2D, null, 0);

        const [x, y, width, height] = this.gl.getParameter(this.gl.VIEWPORT);
        this.gl.viewport(
            x * this.props.scale,
            y * this.props.scale,
            width * this.props.scale,
            height * this.props.scale,
        );
        this.gl.disable(this.gl.DEPTH_TEST);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);

        renderables.forEach((r) => {
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, r.buffer.vertices);
            const vertexPosition = this.locations.getAttribute('vertexPosition');
            this.gl.vertexAttribPointer(vertexPosition, 3, this.gl.FLOAT, false, 0, 0);
            this.gl.enableVertexAttribArray(vertexPosition);

            this.gl.uniformMatrix4fv(this.locations.getUniform('modelViewMatrix'), false, r.matrix.modelView);
            this.gl.uniformMatrix4fv(this.locations.getUniform('projectionMatrix'), false, r.matrix.projection);

            let offset = 0;
            this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, r.buffer.faces);
            r.object.faces.forEach((f) => {
                this.gl.drawElements(this.gl.TRIANGLES, f.vertex_indices.length, this.gl.UNSIGNED_SHORT, offset);
                // Offset must be a multiple of 2 since an unsigned short is 2 bytes.
                offset += f.vertex_indices.length * 2;
            })
        });

        this.gl.viewport(x, y, width, height);
    }
}
