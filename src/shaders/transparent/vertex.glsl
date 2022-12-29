#version 300 es

in vec4 vertexPosition;
in vec3 normal;

out highp float fragDepth;
out highp vec3 fragNormal;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;

void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vertexPosition;
    fragDepth = gl_Position.z / gl_Position.w;
    fragNormal = (modelViewMatrix * vec4(normal, 0)).xyz;
}