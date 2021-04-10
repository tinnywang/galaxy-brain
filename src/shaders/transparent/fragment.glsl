#version 300 es

precision highp float;

uniform sampler2D depthTexture;
uniform highp vec3 color;
uniform bool shouldDepthPeel;

out vec4 fragColor;

void main() {
    float depth = texelFetch(depthTexture, ivec2(gl_FragCoord.xy), 0).r;
    if (shouldDepthPeel && gl_FragCoord.z <= depth) {
        discard;
    } else {
        fragColor = vec4(color, 1);
    }
}