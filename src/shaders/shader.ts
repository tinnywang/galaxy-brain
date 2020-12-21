import vertexSrc from './flat/vertex.glsl';
import fragmentSrc from './flat/fragment.glsl';

export interface Shader {
    program: WebGLProgram
    vertexPosition: number
    modelViewProjectionMatrix: WebGLUniformLocation | null
    color: WebGLUniformLocation | null
}

export function initShader(gl: WebGLRenderingContext): Shader {
    const shaderProgram = gl.createProgram();
    if (shaderProgram === null) {
        throw new Error("Unable to create a WebGLProgram.")
    }

    const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexSrc);
    const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSrc);

    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        throw new Error('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
    }

    gl.useProgram(shaderProgram);

    const vertexPosition = gl.getAttribLocation(shaderProgram, 'vertexPosition');
    gl.enableVertexAttribArray(vertexPosition)

    return {
        program: shaderProgram,
        vertexPosition,
        modelViewProjectionMatrix: gl.getUniformLocation(shaderProgram, 'modelViewProjectionMatrix'),
        color: gl.getUniformLocation(shaderProgram, 'color'),
    }
}

function compileShader(gl: WebGLRenderingContext, type: number, src: string): WebGLShader {
    const shader = gl.createShader(type);
    if (shader === null) {
        throw new Error("Unable to create a WebGLShader.")
    }

    gl.shaderSource(shader, src);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader);
        throw new Error("Unable to compile shader: " + src);
    }
  
    return shader;
}