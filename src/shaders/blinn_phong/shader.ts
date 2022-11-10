import vertexSrc from './vertex.glsl'
import fragmentSrc from './fragment.glsl'
import { Shader } from '../shader'
import { Renderable } from '../../renderables/renderable'

export class BlinnPhongShader extends Shader {

    constructor(gl: WebGL2RenderingContext) {
        super(gl, vertexSrc, fragmentSrc)

        this.locations.setAttribute('vertexPosition');
        this.locations.setUniform('modelViewMatrix');
        this.locations.setUniform('projectionMatrix');
        this.locations.setUniform('color');
        this.locations.setAttribute('normal');
    }

    render(drawFramebuffer: WebGLFramebuffer, ...renderables: Renderable[]) {
        super.render(drawFramebuffer, ...renderables);

        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.depthFunc(this.gl.LEQUAL)
        this.gl.enable(this.gl.CULL_FACE)
        this.gl.cullFace(this.gl.BACK)

        this.gl.bindFramebuffer(this.gl.DRAW_FRAMEBUFFER, drawFramebuffer);

        renderables.forEach((r) => {
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, r.buffer.vertices);
            const vertexPosition = this.locations.getAttribute('vertexPosition');
            this.gl.vertexAttribPointer(vertexPosition, 3, this.gl.FLOAT, false, 0, 0);
            this.gl.enableVertexAttribArray(vertexPosition);

            this.gl.uniformMatrix4fv(this.locations.getUniform('modelViewMatrix'), false, r.matrix.modelView);
            this.gl.uniformMatrix4fv(this.locations.getUniform('projectionMatrix'), false, r.matrix.projection);

            let offset = 0
            this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, r.buffer.faces)
            r.object.faces.forEach((f) => {
                this.gl.uniform3fv(this.locations.getUniform('color'), f.material.diffuse)

                this.gl.bindBuffer(this.gl.ARRAY_BUFFER, r.buffer.normals);
                const normal = this.locations.getAttribute('normal');
                this.gl.vertexAttribPointer(normal, 3, this.gl.FLOAT, false, 0, 0);
                this.gl.enableVertexAttribArray(normal);

                this.gl.drawElements(this.gl.TRIANGLES, f.vertex_indices.length, this.gl.UNSIGNED_SHORT, offset)
                // Offset must be a multiple of 2 since an unsigned short is 2 bytes.
                offset += f.vertex_indices.length * 2
            })
        });
    }
}