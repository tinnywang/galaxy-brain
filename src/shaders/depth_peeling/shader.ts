import WebGL2 from "../../gl";
import { Renderable } from "../../renderables/renderable";
import { Shader } from "../shader";

export interface DepthPeelingProps {
    opaqueDepthTexture: WebGLTexture;
    iterations: number;
}

export class DepthPeeling {
    private props: DepthPeelingProps;
    private shader: Shader;

    public readonly framebuffer: WebGLFramebuffer | null;
    public readonly depthTextures: Array<WebGLTexture>;
    public readonly colorTextures: Array<WebGLTexture>;

    constructor(shader: Shader, props: DepthPeelingProps) {
        this.props = props;
        this.shader = shader;
        this.framebuffer = shader.gl.createFramebuffer();
        this.depthTextures = WebGL2.createDepthTextures(shader.gl, props.iterations);
        this.colorTextures = WebGL2.createColorTextures(shader.gl, props.iterations);

        shader.locations.setUniform('opaqueDepthTexture');
        shader.locations.setUniform('peelDepthTexture');
        shader.locations.setUniform('shouldDepthPeel');
    }

    public depthPeel(func: (_: Renderable) => void, renderables: Renderable[]) {
        const gl = this.shader.gl;
        gl.useProgram(this.shader.program);

        // Texture unit 0 is used for the depth peel read/write texture.
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, this.props.opaqueDepthTexture);
        gl.uniform1i(this.shader.locations.getUniform('opaqueDepthTexture'), 1);

        for (let i = 0; i < this.props.iterations; i++) {
            const readTexture = this.depthTextures.at(i - 1) || null;
            const writeTexture = this.depthTextures.at(i)  || null;

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, readTexture);
            gl.uniform1i(this.shader.locations.getUniform('peelDepthTexture'), 0);

            // No depth peeling on 0th iteration.
            gl.uniform1i(this.shader.locations.getUniform('shouldDepthPeel'), i);

            gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, this.framebuffer);
            gl.framebufferTexture2D(gl.DRAW_FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, writeTexture, 0);
            gl.framebufferTexture2D(gl.DRAW_FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.colorTextures[i], 0);

            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            gl.disable(gl.CULL_FACE);
            gl.enable(gl.DEPTH_TEST);
            gl.depthFunc(gl.LESS);

            renderables.forEach(func);
        }
    }
}
