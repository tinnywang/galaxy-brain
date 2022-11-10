#version 300 es

in vec4 vertexPosition;
in vec3 normal;

out highp float fragDepth;
out highp vec3 fragNormal;
out highp vec4 fragPosition;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;

void main(void) {
    fragPosition = modelViewMatrix * vertexPosition;
    gl_Position = projectionMatrix * fragPosition;
    fragDepth = gl_Position.z / gl_Position.w;
    fragNormal = normal;
}