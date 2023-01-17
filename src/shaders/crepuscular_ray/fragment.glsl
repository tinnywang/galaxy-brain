#version 300 es

precision highp float;

in vec2 texturePosition;
in vec2 lightRay;

out vec4 fragColor;

uniform sampler2D textureImage;
uniform int samples;
uniform float density;
uniform float weight;
uniform float decay;
uniform float exposure;

void main(void) {
    vec2 delta = lightRay / float(samples) * density;
    vec2 samplePosition = texturePosition;
    float illuminationDecay = 1.0;
    fragColor = texture(textureImage, texturePosition);

    for (int i = 0; i < samples; i++) {
        samplePosition -= delta;
        vec4 sampleColor = texture(textureImage, samplePosition) * illuminationDecay * weight;
        fragColor += sampleColor;
        illuminationDecay *= decay;
    }

    fragColor *= exposure;
}