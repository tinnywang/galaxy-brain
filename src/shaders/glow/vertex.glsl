#version 300 es

precision highp float;

in vec4 vertexPosition;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform float radius;
uniform float timestamp;
uniform float animationDuration;

void main(void) {
    gl_Position = projectionMatrix * modelViewMatrix * vertexPosition;

    float rand = random(gl_Position.xy);
    float periodOffset = rand * animationDuration;
    float animationScale = rand * sin(timestamp / animationDuration + periodOffset);
    gl_PointSize = radius * animationScale;
}
