import vertexSrc from './vertex.glsl';
import fragmentSrc from './fragment.glsl';
import { Shader } from '../shader';
import { PostProcessing } from '../post_processing/shader';
import { Model } from '../../models/model';
import WebGL2 from '../../gl';
import { vec3 } from 'gl-matrix';
import { Face } from '../../object';

const NUM_PASSES = 4;

export interface TransparentShaderProps {
    opaqueDepthTexture: WebGLTexture;
    fresnelColor: vec3;
    fresnelHueShift: number;
    fresnelExponent: number;
}

export class TransparentShader extends Shader<Model> {
    private props: TransparentShaderProps;

    private postProcessing: PostProcessing;

    private framebuffer: WebGLFramebuffer | null;
    private depthTextures: Array<WebGLTexture>
    private colorTextures: Array<WebGLTexture>;

    constructor(gl: WebGL2RenderingContext, props: TransparentShaderProps) {
        super(gl, vertexSrc, fragmentSrc);

        this.props = props;

        this.postProcessing = new PostProcessing(gl);

        this.framebuffer = gl.createFramebuffer();
        this.depthTextures = WebGL2.createDepthTextures(this.gl, 2);
        this.colorTextures = WebGL2.createColorTextures(this.gl, NUM_PASSES);

        this.locations.setAttribute('vertexPosition');
        this.locations.setAttribute('normal');
        this.locations.setUniform('modelViewMatrix');
        this.locations.setUniform('projectionMatrix');
        this.locations.setUniform('color');
        this.locations.setUniform('opaqueDepthTexture');
        this.locations.setUniform('peelDepthTexture');
        this.locations.setUniform('shouldDepthPeel');

        // Uniforms for Fresnel effect outline.
        this.locations.setUniform('eye');
        this.locations.setUniform('fresnelColor');
        this.locations.setUniform('fresnelHueShift');
        this.locations.setUniform('fresnelExponent');
    }

    render(timestamp: DOMHighResTimeStamp, drawFramebuffer: WebGLFramebuffer, ...models: Model[]) {
        super.render(timestamp, drawFramebuffer, ...models);

        this.gl.uniform3fv(this.locations.getUniform('fresnelColor'), this.props.fresnelColor);
        this.gl.uniform1f(this.locations.getUniform('fresnelHueShift'), this.props.fresnelHueShift);
        this.gl.uniform1f(this.locations.getUniform('fresnelExponent'), this.props.fresnelExponent);

        // Texture units 0 and 1 are used for the depth peel read/write textures.
        this.gl.activeTexture(this.gl.TEXTURE2);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.props.opaqueDepthTexture);
        this.gl.uniform1i(this.locations.getUniform('opaqueDepthTexture'), 2);

        for (let i = 0; i < NUM_PASSES; i++) {
            this.depthPeel(i);

            models?.forEach((m) => {
                m.render(this.gl, this.locations, (f: Face) => {
                    this.gl.uniform4fv(this.locations.getUniform('color'), [...f.material.diffuse, m.alpha]);
                });
            });
        }

        // Alpha-blend color textures back-to-front.
        this.gl.bindFramebuffer(this.gl.READ_FRAMEBUFFER, this.framebuffer);
        this.gl.bindFramebuffer(this.gl.DRAW_FRAMEBUFFER, drawFramebuffer);

        this.gl.disable(this.gl.DEPTH_TEST);
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

        for (let i = NUM_PASSES - 1; i >= 0; i--) {
            this.postProcessing.render(timestamp, this.colorTextures[i]);
        }
    }

    private depthPeel(i: number) {
        const readIndex = i % 2;
        const writeIndex = (i + 1) % 2;

        this.gl.activeTexture(this.gl.TEXTURE0 + readIndex);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.depthTextures[readIndex]);
        this.gl.uniform1i(this.locations.getUniform('peelDepthTexture'), readIndex);

        // No depth peeling on 0th iteration.
        this.gl.uniform1i(this.locations.getUniform('shouldDepthPeel'), i);

        this.gl.bindFramebuffer(this.gl.DRAW_FRAMEBUFFER, this.framebuffer);
        this.gl.activeTexture(this.gl.TEXTURE0 + writeIndex);
        this.gl.framebufferTexture2D(this.gl.DRAW_FRAMEBUFFER,this.gl.DEPTH_ATTACHMENT,this.gl.TEXTURE_2D, this.depthTextures[writeIndex], 0);
        this.gl.framebufferTexture2D(this.gl.DRAW_FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, this.colorTextures[i], 0);

        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        this.gl.disable(this.gl.CULL_FACE);
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.depthFunc(this.gl.LESS)
    }
}
