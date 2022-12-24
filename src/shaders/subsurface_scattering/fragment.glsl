#version 300 es

#define SIGMA 10.0

precision highp float;

in float fragDepth;
in vec4 lightTextCoord;
in float lightFragDist;

out vec4 fragColor;

uniform sampler2D opaqueDepthTexture;
uniform sampler2D lightDepthTexture;
uniform highp vec3 color;

void main() {
    // Use pre-computed fragment depth to eliminate variance between gl_FragCoord.z and depth texture
    // (see "An Invariance Issue" - https://my.eng.utah.edu/~cs5610/handouts/order_independent_transparency.pdf).
    gl_FragDepth = fragDepth;

    ivec2 textCoord = ivec2(gl_FragCoord.xy);
    float opaqueDepth = texelFetch(opaqueDepthTexture, textCoord, 0).r;

    if (opaqueDepth < fragDepth) {
        discard;
    } else {
        float lightDepth = 1.0 / texture(lightDepthTexture, lightTextCoord.xy).r;
        float lightDistance = abs(lightFragDist - lightDepth);

        fragColor = exp(-lightDistance * SIGMA) * vec4(color, 1);
    }
}
