#version 300 es

in vec4 vertexPosition;

out highp float fragDepth;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;

void main() {
    vec4 fragPosition = modelViewMatrix * vertexPosition;
    gl_Position = projectionMatrix * fragPosition;

    fragDepth = gl_Position.z / gl_Position.w;
}
