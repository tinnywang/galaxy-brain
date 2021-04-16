#version 300 es

precision highp float;

in float fragDepth;

out vec4 fragColor;

uniform sampler2D depthTexture;
uniform highp vec3 color;
uniform bool shouldDepthPeel;

void main() {
    // Use pre-computed fragment depth to eliminate variance between gl_FragCoord.z and depth texture
    // (see "An Invariance Issue" - https://my.eng.utah.edu/~cs5610/handouts/order_independent_transparency.pdf).
    gl_FragDepth = fragDepth;

    float depth = texelFetch(depthTexture, ivec2(gl_FragCoord.xy), 0).r;
    if (shouldDepthPeel && gl_FragDepth <= depth) {
        discard;
    } else {
        fragColor = vec4(color, 1);
    }
}