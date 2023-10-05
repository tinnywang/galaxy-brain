#version 300 es

in vec4 vertexPosition;
in vec3 normal;

out highp float fragDepth;
out highp vec3 fragNormal;
out highp vec2 textCoord;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;

void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vertexPosition;
    fragDepth = gl_Position.z / gl_Position.w;
    fragNormal = normalize((modelViewMatrix * vec4(normal, 0)).xyz);
    textCoord = gl_Position.xy / gl_Position.w * 0.5 + 0.5;
}