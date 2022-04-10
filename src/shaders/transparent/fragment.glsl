#version 300 es

precision highp float;

in float fragDepth;

out vec4 fragColor;

uniform sampler2D opaqueDepthTexture;
uniform sampler2D opaqueColorTexture;
uniform sampler2D peelDepthTexture;
uniform highp vec3 color;
uniform bool shouldDepthPeel;

void main() {
    // Use pre-computed fragment depth to eliminate variance between gl_FragCoord.z and depth texture
    // (see "An Invariance Issue" - https://my.eng.utah.edu/~cs5610/handouts/order_independent_transparency.pdf).
    gl_FragDepth = fragDepth;

    ivec2 textCoord = ivec2(gl_FragCoord.xy);
    float peelDepth = texelFetch(peelDepthTexture, textCoord, 0).r;
    float opaqueDepth = texelFetch(opaqueDepthTexture, textCoord, 0).r;

    if (shouldDepthPeel && gl_FragDepth <= peelDepth) {
        discard;
    } else if (opaqueDepth < gl_FragDepth) {
        fragColor = texelFetch(opaqueColorTexture, textCoord, 0);
    } else {
        fragColor = vec4(color, 0.8);
    }
}