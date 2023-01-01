#version 300 es

precision highp float;

in float fragDepth;
in highp vec3 fragNormal;

out vec4 fragColor;

uniform sampler2D opaqueDepthTexture;
uniform sampler2D peelDepthTexture;
uniform highp vec3 color;
uniform bool shouldDepthPeel;

// Uniforms for Fresnel effect outline.
uniform highp vec3 eye;
uniform highp vec3 fresnelColor;
uniform float fresnelExponent;


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
        discard;
    } else {
        float dotProduct = abs(dot(normalize(fragNormal), normalize(eye)));
        float fresnel = smoothstep(0.0, 1.0, pow(1.0 - dotProduct, fresnelExponent));
        fragColor = fresnel * vec4(fresnelColor + color, 1);

        // Color the inner fragments, except for the top-most layer's so that nested objects aren't occluded.
        if (shouldDepthPeel) {
            fresnel = smoothstep(0.0, 1.0, dotProduct);
            fragColor += fresnel * vec4(0, 0.15, 0.8, 1);
        }
    }
}