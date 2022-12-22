#version 300 es

in vec4 vertexPosition;

out highp float fragDepth;
out vec4 lightTextCoord;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform mat4 modelLightMatrix;

void main() {
    vec4 fragLightPosition = projectionMatrix * modelLightMatrix * vertexPosition;

    lightTextCoord = fragLightPosition / fragLightPosition.w * 0.5 + 0.5;

    gl_Position = projectionMatrix * modelViewMatrix * vertexPosition;
    fragDepth = gl_Position.z / gl_Position.w;
}
