#version 300 es

precision highp float;

in float fragDepth;
in float fragDistance;

out vec4 fragColor;

uniform sampler2D opaqueDepthTexture;
uniform sampler2D peelDepthTexture;
uniform bool shouldDepthPeel;

void main() {
    gl_FragDepth = fragDepth;

    ivec2 textCoord = ivec2(gl_FragCoord.xy);
    float peelDepth = texelFetch(peelDepthTexture, textCoord, 0).r;
    float opaqueDepth = texelFetch(opaqueDepthTexture, textCoord, 0).r;

    if (shouldDepthPeel && gl_FragDepth <= peelDepth) {
        discard;
    } else if (opaqueDepth < gl_FragDepth) {
        discard;
    } else {
        // gl_FragDepth must be clamped to [0, 1];
        float r = fragDistance == 0.0 ? 0.0 : 1.0 / fragDistance;
        fragColor = vec4(r, 0, 0, 1);
    }
}
