#version 300 es

precision highp float;

in float fragDepth;

out vec4 fragColor;

uniform vec3 color;
uniform float radius;

void main(void) {
    gl_FragDepth = fragDepth;

    float dist = distance(gl_PointCoord, vec2(0.5, 0.5));
    float falloff = 1.0 - clamp(dist, 0.0, 1.0);
    vec3 innerColor = vec3(color) * falloff * falloff;
    // vec3 outerColor = vec3(1.0, 1.0, 1.0) * falloff;
    // fragColor = vec4(innerColor + outerColor, falloff);
    fragColor = vec4(innerColor, falloff);
}