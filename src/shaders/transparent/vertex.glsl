#version 300 es

in vec4 vertexPosition;

uniform mat4 modelViewProjectionMatrix;

void main() {
    gl_Position = modelViewProjectionMatrix * vertexPosition;
}