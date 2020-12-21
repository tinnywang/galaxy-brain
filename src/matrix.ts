import { vec3, glMatrix, mat4 } from "gl-matrix";

const EYE = vec3.fromValues(0, 0, 10);
const CENTER = vec3.fromValues(0, 0, 0);
const UP = vec3.fromValues(0, 1, 0);
const FOV = glMatrix.toRadian(90);
const NEAR = 1;
const FAR = 1000;

export class Matrix {
    readonly view: mat4;
    readonly projection: mat4;
    readonly modelView: mat4;
    readonly modelViewProjection: mat4;

    constructor(gl: WebGLRenderingContext, model?: mat4) {
        this.view = mat4.lookAt(mat4.create(), EYE, CENTER, UP);
        this.projection = mat4.perspective(mat4.create(), FOV, gl.drawingBufferWidth / gl.drawingBufferHeight, NEAR, FAR);
        this.modelView = mat4.multiply(mat4.create(), this.view, model || mat4.create());
        this.modelViewProjection = mat4.multiply(mat4.create(), this.projection, this.modelView);
    }
}