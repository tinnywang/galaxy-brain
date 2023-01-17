#version 300 es

in vec2 vertexPosition;
in vec3 lightPosition;

out highp vec2 texturePosition;
out highp vec2 lightRay;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;

void main(void) {
    // gl_Position coordinates are in the range [-1, 1].
    gl_Position = vec4(vertexPosition, 0, 1);

    // Texture coordinates are in the range [0, 1].
    texturePosition = vertexPosition * 0.5 + 0.5;

    // Normalized-device coordinates (NDC) are in the rante [-1, 1].
    vec4 lightPositionNDC = projectionMatrix * modelViewMatrix * vec4(lightPosition, 1);
    lightPositionNDC /= lightPositionNDC.w;

    lightRay = vertexPosition - lightPositionNDC.xy;
}