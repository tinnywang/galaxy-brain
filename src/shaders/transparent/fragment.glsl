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
uniform highp vec3 fresnelColor;
uniform float fresnelHueShift;
uniform float fresnelExponent;

const vec3 Z_AXIS = vec3(0, 0, 1);

// Shift the hue of an RGB color.
// https://gist.github.com/mairod/a75e7b44f68110e1576d77419d608786?permalink_comment_id=3195243#gistcomment-3195243
vec3 hueShift(vec3 color, float hue) {
    const vec3 k = vec3(0.57735, 0.57735, 0.57735);
    float cosAngle = cos(hue);
    return vec3(color * cosAngle + cross(k, color) * sin(hue) + k * dot(k, color) * (1.0 - cosAngle));
}

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
        float dotProduct = abs(dot(normalize(fragNormal), Z_AXIS));

        float fresnel = smoothstep(0.0, 1.0, pow(1.0 - dotProduct, fresnelExponent));
        vec3 gradientColor = hueShift(color, fresnelHueShift);
        fragColor = fresnel * vec4(fresnelColor + gradientColor, 1);

        fresnel = smoothstep(0.0, 1.0, dotProduct);
        fragColor = mix(fragColor, fresnel * vec4(color, 1), dotProduct);
    }
}