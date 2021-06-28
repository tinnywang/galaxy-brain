#version 300 es

precision highp float;

in vec2 texturePosition;

out vec4 fragColor;

uniform sampler2D textureImage;

void main(void) {
    fragColor = texture(textureImage, texturePosition);
}