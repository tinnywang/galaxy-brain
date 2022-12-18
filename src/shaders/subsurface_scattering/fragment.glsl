#version 300 es

#define SIGMA 1.3

precision highp float;

in float fragDepth;
in vec4 fragLightPosition;
in vec4 lightTextCoord;

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
        float lightDepth0 = texelFetch(lightDepthTexture, ivec2(lightTextCoord).xy, 0).r;
        float lightDepth1 = length(fragLightPosition);
        float lightDistance = abs(lightDepth0 - lightDepth1);

        fragColor = exp(-lightDistance * SIGMA) * vec4(color, 1);
        // fragColor = vec4(color, 1);
    }
}