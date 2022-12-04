import vertexSrc from './vertex.glsl'
import fragmentSrc from './fragment.glsl'
import { Shader } from '../shader'
import { Renderable } from '../../renderables/renderable'
import Matrix from '../../matrix'
import { Light } from '../../light'

export class BlinnPhongShader extends Shader {
    private readonly lights: Light[];

    constructor(gl: WebGL2RenderingContext, lights: Light[]) {
        super(gl, vertexSrc, fragmentSrc.replace('${numLights}', lights.length.toString()));

        this.locations.setAttribute('vertexPosition');
        this.locations.setUniform('modelViewMatrix');
        this.locations.setUniform('projectionMatrix');
        this.locations.setAttribute('normal');
        this.locations.setAttribute('eye');

        this.locations.setUniform('material.ambient');
        this.locations.setUniform('material.diffuse');
        this.locations.setUniform('material.specular');
        this.locations.setUniform('material.specularExponent');

        this.lights = lights;
        this.lights.forEach((_, i) => {
            this.locations.setUniform(`lights[${i}].position`);
            this.locations.setUniform(`lights[${i}].color`);
            this.locations.setUniform(`lights[${i}].power`);
        });
    }

    render(drawFramebuffer: WebGLFramebuffer, ...renderables: Renderable[]) {
        super.render(drawFramebuffer, ...renderables);

        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.depthFunc(this.gl.LEQUAL)
        this.gl.enable(this.gl.CULL_FACE)
        this.gl.cullFace(this.gl.BACK)

        this.gl.bindFramebuffer(this.gl.DRAW_FRAMEBUFFER, drawFramebuffer);

        this.gl.uniform3fv(this.locations.getUniform('eye'), Matrix.EYE);

        renderables.forEach((r) => {
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, r.buffer.vertices);
            const vertexPosition = this.locations.getAttribute('vertexPosition');
            this.gl.vertexAttribPointer(vertexPosition, 3, this.gl.FLOAT, false, 0, 0);
            this.gl.enableVertexAttribArray(vertexPosition);

            this.gl.uniformMatrix4fv(this.locations.getUniform('modelViewMatrix'), false, r.matrix.modelView);
            this.gl.uniformMatrix4fv(this.locations.getUniform('projectionMatrix'), false, r.matrix.projection);

            this.lights.forEach((light, i) => {
                this.gl.uniform3fv(this.locations.getUniform(`lights[${i}].position`), light.position);
                this.gl.uniform3fv(this.locations.getUniform(`lights[${i}].color`), light.color);
                this.gl.uniform1f(this.locations.getUniform(`lights[${i}].power`), light.power);
            });

            let offset = 0
            this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, r.buffer.faces);
            r.object.faces.forEach((f) => {
                this.gl.uniform3fv(this.locations.getUniform('material.ambient'), f.material.diffuse);
                this.gl.uniform3fv(this.locations.getUniform('material.diffuse'), f.material.diffuse);
                this.gl.uniform3fv(this.locations.getUniform('material.specular'), f.material.specular);
                this.gl.uniform1f(this.locations.getUniform('material.specularExponent'), f.material.specular_exponent);

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
