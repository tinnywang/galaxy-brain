attribute vec4 vertexPosition;

uniform mat4 projectionMatrix;

varying vec2 texturePosition;

void main(void) {
    gl_Position = projectionMatrix * vertexPosition;
    texturePosition = gl_Position.xy;
}