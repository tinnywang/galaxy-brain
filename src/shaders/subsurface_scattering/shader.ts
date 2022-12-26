import vertexSrc from './vertex.glsl';
import fragmentSrc from './fragment.glsl';
import { Shader } from '../shader';
import { Renderable } from '../../renderables/renderable';
import { Light } from '../../light';
import { DepthMap } from '../depth_map/shader';
import { DepthPeeling } from '../depth_peeling/shader';
import { PostProcessing } from '../post_processing/shader';

const NUM_PASSES = 4;

export interface SubsurfaceScatteringProps {
    light: Light;
    opaqueDepthTexture: WebGLTexture;
}

export class SubsurfaceScattering extends Shader {
    private props: SubsurfaceScatteringProps;
    private depthMap: DepthMap;
    private depthPeeling: DepthPeeling;
    private postProcessing: PostProcessing;

    constructor(gl: WebGL2RenderingContext, props: SubsurfaceScatteringProps) {
        super(gl, vertexSrc, fragmentSrc);

        this.props = props;

        this.depthMap = new DepthMap(gl, {
            ...props,
            eye: props.light.position,
        });
        this.depthPeeling = new DepthPeeling(this, {
            opaqueDepthTexture: props.opaqueDepthTexture,
            iterations: NUM_PASSES,
        });
        this.postProcessing = new PostProcessing(gl);

        this.locations.setAttribute('vertexPosition');
        this.locations.setUniform('modelViewMatrix');
        this.locations.setUniform('projectionMatrix');
        this.locations.setUniform('modelLightMatrix');
        this.locations.setUniform('opaqueDepthTexture');
        this.locations.setUniform('lightDepthTexture');
        this.locations.setUniform('color');
    }

    render(drawFramebuffer: WebGLFramebuffer | null, ...renderables: Renderable[]) {
        // Generate depth maps from the light's perspective.
        this.depthMap.render(...renderables);

        this.gl.useProgram(this.program);

        this.gl.uniform3fv(this.locations.getUniform('color'), this.props.light.color);
        this.gl.uniformMatrix4fv(this.locations.getUniform('modelLightMatrix'), false, this.depthMap.matrix.modelView);

        this.depthPeeling.depthPeel((r: Renderable, i: number) => {
            this.gl.uniformMatrix4fv(this.locations.getUniform('modelViewMatrix'), false, r.matrix.modelView);
            this.gl.uniformMatrix4fv(this.locations.getUniform('projectionMatrix'), false, r.matrix.projection);

            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, r.buffer.vertices);
            const vertexPosition = this.locations.getAttribute('vertexPosition');
            this.gl.vertexAttribPointer(vertexPosition, 3, this.gl.FLOAT, false, 0, 0);
            this.gl.enableVertexAttribArray(vertexPosition);

            // Texture units 0 and 1 are used for depth peeling.
            this.gl.activeTexture(this.gl.TEXTURE2);
            this.gl.bindTexture(this.gl.TEXTURE_2D, this.depthMap.depthTexture(i));
            this.gl.uniform1i(this.locations.getUniform('lightDepthTexture'), 2);

            let offset = 0
            this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, r.buffer.faces);
            r.object.faces.forEach((f) => {
                this.gl.drawElements(this.gl.TRIANGLES, f.vertex_indices.length, this.gl.UNSIGNED_SHORT, offset);
                // Offset must be a multiple of 2 since an unsigned short is 2 bytes.
                offset += f.vertex_indices.length * 2
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
