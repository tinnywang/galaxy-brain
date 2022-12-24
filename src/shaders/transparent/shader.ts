import vertexSrc from './vertex.glsl';
import fragmentSrc from './fragment.glsl';
import { Shader } from '../shader';
import { PostProcessing } from '../post_processing/shader';
import { Renderable } from '../../renderables/renderable';
import { DepthPeeling } from '../depth_peeling/shader';

const NUM_PASSES = 4;

export interface TransparentShaderProps {
    opaqueDepthTexture: WebGLTexture;
}

export class TransparentShader extends Shader {
    private depthPeeling: DepthPeeling;
    private postProcessing: PostProcessing;

    constructor(gl: WebGL2RenderingContext, props: TransparentShaderProps) {
        super(gl, vertexSrc, fragmentSrc);

        this.depthPeeling = new DepthPeeling(this, {
            opaqueDepthTexture: props.opaqueDepthTexture,
            iterations: NUM_PASSES,
        });
        this.postProcessing = new PostProcessing(gl);

        this.locations.setAttribute('vertexPosition');
        this.locations.setUniform('modelViewMatrix');
        this.locations.setUniform('projectionMatrix');
        this.locations.setUniform('color');
        this.locations.setUniform('opaqueDepthTexture');
        this.locations.setUniform('peelDepthTexture');
        this.locations.setUniform('shouldDepthPeel');
    }

    render(drawFramebuffer: WebGLFramebuffer, ...renderables: Renderable[]) {
        this.depthPeeling.depthPeel((r: Renderable) => {
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, r.buffer.vertices);
            const vertexPosition = this.locations.getAttribute('vertexPosition');
            this.gl.vertexAttribPointer(vertexPosition, 3, this.gl.FLOAT, false, 0, 0);
            this.gl.enableVertexAttribArray(vertexPosition);

            this.gl.uniformMatrix4fv(this.locations.getUniform('modelViewMatrix'), false, r.matrix.modelView);
            this.gl.uniformMatrix4fv(this.locations.getUniform('projectionMatrix'), false, r.matrix.projection);

            let offset = 0;
            this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, r.buffer.faces);
            r.object.faces.forEach((f) => {
                this.gl.uniform3fv(this.locations.getUniform('color'), f.material.diffuse);

                this.gl.drawElements(this.gl.TRIANGLES, f.vertex_indices.length, this.gl.UNSIGNED_SHORT, offset);
                // Offset must be a multiple of 2 since an unsigned short is 2 bytes.
                offset += f.vertex_indices.length * 2;
            })
        }, renderables);

        // Alpha-blend color textures back-to-front.
        this.gl.bindFramebuffer(this.gl.READ_FRAMEBUFFER, this.depthPeeling.framebuffer);
        this.gl.bindFramebuffer(this.gl.DRAW_FRAMEBUFFER, drawFramebuffer);

        this.gl.disable(this.gl.DEPTH_TEST);
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

        for (let i = NUM_PASSES - 1; i >= 0; i--) {
            this.postProcessing.render(this.depthPeeling.colorTextures[i]);
        }
    }
}
