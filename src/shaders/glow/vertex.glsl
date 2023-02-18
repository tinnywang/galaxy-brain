#version 300 es

in vec4 vertexPosition;

out highp float fragDepth;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform float radius;

void main(void) {
    gl_Position = projectionMatrix * modelViewMatrix * vertexPosition;

    fragDepth = gl_Position.z / gl_Position.w;

    gl_PointSize = radius;
}
