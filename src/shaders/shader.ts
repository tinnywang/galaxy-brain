import { Model } from '../models/model';
import { ShaderLocations } from './shader_locations';

export abstract class Shader {
    readonly gl: WebGL2RenderingContext;
    readonly program: WebGLProgram;
    readonly locations: ShaderLocations;

    constructor(gl: WebGL2RenderingContext, vertexSrc: string, fragmentSrc: string) {
      const program = gl.createProgram()
      if (program === null) {
        throw new Error('Unable to create a WebGLProgram.')
      }

      const vertexShader = this.compileShader(gl, gl.VERTEX_SHADER, vertexSrc)
      const fragmentShader = this.compileShader(gl, gl.FRAGMENT_SHADER, fragmentSrc)

      gl.attachShader(program, vertexShader)
      gl.attachShader(program, fragmentShader)
      gl.linkProgram(program)

      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error('Unable to initialize the shader program: ' + gl.getProgramInfoLog(program))
      }

      gl.useProgram(program)

      this.gl = gl
      this.program = program
      this.locations = new ShaderLocations(gl, program);
    }

    private compileShader(gl: WebGL2RenderingContext, type: number, src: string): WebGLShader {
      const shader = gl.createShader(type)
      if (shader === null) {
        throw new Error('Unable to create a WebGLShader.')
      }

      gl.shaderSource(shader, src)
      gl.compileShader(shader)

      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader)
        throw new Error('Unable to compile shader: ' + src)
      }

      return shader
    }

    render(_framebuffer: WebGLFramebuffer, ..._models: Model[]) {
      this.gl.useProgram(this.program);
    }
}
