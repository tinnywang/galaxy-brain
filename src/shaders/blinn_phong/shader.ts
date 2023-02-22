import vertexSrc from './vertex.glsl';
import fragmentSrc from './fragment.glsl';
import { Shader } from '../shader';
import { Model } from '../../models/model';
import Matrix from '../../matrix';
import { Light } from '../../light';
import { Face } from '../../object';

export interface BlinnPhongProps {
    lights: Light[];
}

export class BlinnPhongShader extends Shader<Model> {
    private readonly lights: Light[];

    constructor(gl: WebGL2RenderingContext, props: BlinnPhongProps) {
        super(gl, vertexSrc, fragmentSrc.replace('${numLights}', props.lights.length.toString()));

        this.locations.setAttribute('vertexPosition');
        this.locations.setUniform('modelViewMatrix');
        this.locations.setUniform('projectionMatrix');
        this.locations.setAttribute('normal');
        this.locations.setAttribute('eye');

        this.locations.setUniform('material.ambient');
        this.locations.setUniform('material.diffuse');
        this.locations.setUniform('material.specular');
        this.locations.setUniform('material.specularExponent');

        this.lights = props.lights;
        this.lights.forEach((_, i) => {
            this.locations.setUniform(`lights[${i}].position`);
            this.locations.setUniform(`lights[${i}].color`);
            this.locations.setUniform(`lights[${i}].power`);
        });
    }

    render(drawFramebuffer: WebGLFramebuffer, ...models: Model[]) {
        super.render(drawFramebuffer, ...models);

        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.depthFunc(this.gl.LEQUAL)
        this.gl.enable(this.gl.CULL_FACE)
        this.gl.cullFace(this.gl.BACK)

        this.gl.bindFramebuffer(this.gl.DRAW_FRAMEBUFFER, drawFramebuffer);

        this.gl.uniform3fv(this.locations.getUniform('eye'), Matrix.EYE);

        this.lights.forEach((light, i) => {
            this.gl.uniform3fv(this.locations.getUniform(`lights[${i}].position`), light.position);
            this.gl.uniform3fv(this.locations.getUniform(`lights[${i}].color`), light.color);
            this.gl.uniform1f(this.locations.getUniform(`lights[${i}].power`), light.power);
        });

        models?.forEach((m) => {
            m.render(this.gl, this.locations, (f: Face) => {
                this.gl.uniform3fv(this.locations.getUniform('material.ambient'), f.material.ambient);
                this.gl.uniform3fv(this.locations.getUniform('material.diffuse'), f.material.diffuse);
                this.gl.uniform3fv(this.locations.getUniform('material.specular'), f.material.specular);
                this.gl.uniform1f(this.locations.getUniform('material.specularExponent'), f.material.specular_exponent);
            });
        });
    }

}
