#version 300 es

precision highp float;

in float fragDepth;
in float fragDistance;

uniform sampler2D opaqueDepthTexture;

void main() {
    ivec2 textCoord = ivec2(gl_FragCoord.xy);
    float opaqueDepth = texelFetch(opaqueDepthTexture, textCoord, 0).r;

    if (opaqueDepth < fragDepth) {
        discard;
    } else {
        gl_FragDepth = fragDistance;
    }
}
