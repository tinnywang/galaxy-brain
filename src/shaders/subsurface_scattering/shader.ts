import vertexSrc from './vertex.glsl';
import fragmentSrc from './fragment.glsl';
import { Shader } from '../shader';
import { Renderable } from '../../renderables/renderable';
import { Light } from '../../light';
import { DepthMap } from '../depth_map/shader';

export interface SubsurfaceScatteringProps {
    light: Light;
    opaqueDepthTexture: WebGLTexture;
}

export class SubsurfaceScattering extends Shader {
    private props: SubsurfaceScatteringProps;
    private framebuffer: WebGLFramebuffer;
    private depthMap: DepthMap;


    constructor(gl: WebGL2RenderingContext, props: SubsurfaceScatteringProps) {
        super(gl, vertexSrc, fragmentSrc);

        this.props = props;

        const framebuffer = gl.createFramebuffer();
        if (framebuffer === null) {
            throw new Error('Unable to create WebGLFramebuffer.');
        }
        this.framebuffer = framebuffer;

        this.depthMap = new DepthMap(gl, {
            ...props,
            eye: props.light.position,
        });

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
        this.depthMap.render(this.framebuffer, ...renderables);

        this.gl.useProgram(this.program);

        this.gl.bindFramebuffer(this.gl.DRAW_FRAMEBUFFER, drawFramebuffer);
        this.gl.framebufferTexture2D(this.gl.DRAW_FRAMEBUFFER, this.gl.DEPTH_ATTACHMENT, this.gl.TEXTURE_2D, null, 0);

        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.depthFunc(this.gl.LEQUAL);
        this.gl.enable(this.gl.CULL_FACE);
        this.gl.cullFace(this.gl.BACK);

        this.gl.uniform3fv(this.locations.getUniform('color'), this.props.light.color);

        renderables.forEach((r) => {
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, r.buffer.vertices);
            const vertexPosition = this.locations.getAttribute('vertexPosition');
            this.gl.vertexAttribPointer(vertexPosition, 3, this.gl.FLOAT, false, 0, 0);
            this.gl.enableVertexAttribArray(vertexPosition);

            this.gl.uniformMatrix4fv(this.locations.getUniform('modelViewMatrix'), false, r.matrix.modelView);
            this.gl.uniformMatrix4fv(this.locations.getUniform('projectionMatrix'), false, r.matrix.projection);
            this.gl.uniformMatrix4fv(this.locations.getUniform('modelLightMatrix'), false, this.depthMap.matrix.modelView);

            this.gl.activeTexture(this.gl.TEXTURE0);
            this.gl.bindTexture(this.gl.TEXTURE_2D, this.depthMap.depthTexture);
            this.gl.uniform1i(this.locations.getUniform('lightDepthTexture'), 0);

            this.gl.activeTexture(this.gl.TEXTURE1);
            this.gl.bindTexture(this.gl.TEXTURE_2D, this.props.opaqueDepthTexture);
            this.gl.uniform1i(this.locations.getUniform('opaqueDepthTexture'), 1);

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
