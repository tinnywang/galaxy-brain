#version 300 es

in vec4 vertexPosition;

out highp float fragDepth;
out vec4 lightTextCoord;
out highp float lightFragDist;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform mat4 modelLightMatrix;

void main() {
    vec4 lightFragPosition = modelLightMatrix * vertexPosition;
    lightFragDist = length(lightFragPosition);

    lightFragPosition = projectionMatrix * lightFragPosition;
    lightTextCoord = lightFragPosition / lightFragPosition.w * 0.5 + 0.5;

    gl_Position = projectionMatrix * modelViewMatrix * vertexPosition;
    fragDepth = gl_Position.z / gl_Position.w;
}
