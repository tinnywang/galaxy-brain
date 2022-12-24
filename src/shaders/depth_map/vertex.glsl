#version 300 es

#define GROW 0.03

in vec4 vertexPosition;
in vec3 normal;

out highp float fragDepth;
out highp float fragDistance;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;

void main() {
    vec4 position = vertexPosition + GROW * vec4(normal, 1);
    gl_Position = projectionMatrix * modelViewMatrix * position;

    fragDepth = gl_Position.z / gl_Position.w;
    fragDistance = length(modelViewMatrix * vertexPosition);
}
