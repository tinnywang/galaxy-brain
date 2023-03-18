#version 300 es

in vec4 vertexPosition;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform float radius;

void main(void) {
    gl_Position = projectionMatrix * modelViewMatrix * vertexPosition;

    gl_PointSize = radius;
}
