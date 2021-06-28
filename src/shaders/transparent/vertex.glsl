#version 300 es

in vec4 vertexPosition;

out highp float fragDepth;

uniform mat4 modelViewProjectionMatrix;

void main() {
    gl_Position = modelViewProjectionMatrix * vertexPosition;
    fragDepth = gl_Position.z / gl_Position.w;
}