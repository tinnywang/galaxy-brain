attribute vec4 vertexPosition;
uniform mat4 modelViewProjectionMatrix;

void main(void) {
    gl_Position = modelViewProjectionMatrix * vertexPosition;
}