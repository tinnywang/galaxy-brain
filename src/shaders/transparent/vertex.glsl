attribute vec4 vertexPosition;

uniform mat4 modelViewProjectionMatrix;

varying vec2 depthPosition;

void main(void) {
    gl_Position = modelViewProjectionMatrix * vertexPosition;
    depthPosition = gl_Position.xy;
}