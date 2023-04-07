#version 300 es

precision highp float;

in vec4 vertexPosition;

out mat2 rotationMatrix;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform float radius;
uniform float timestamp;
uniform float animationDuration;
uniform float rotationDuration;

void main(void) {
    gl_Position = projectionMatrix * modelViewMatrix * vertexPosition;

    float rand = random(vertexPosition.xy);
    float theta = timestamp / (rand * animationDuration);

    float animationTwinkle = fract(cos(cos(theta * rand) + sin(theta)));
    gl_PointSize = radius + 0.1 * radius * animationTwinkle;

    theta = timestamp / (rand * rotationDuration);
    rotationMatrix[0] = vec2(cos(theta), sin(theta));
    rotationMatrix[1] = vec2(sin(theta), -cos(theta));
}
