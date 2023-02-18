#version 300 es

precision highp float;

in vec2 fragCenter;
in float fragDepth;

out vec4 fragColor;

uniform float radius;
uniform vec3 color;

void main(void) {
    gl_FragDepth = fragDepth;

    float dist = distance(gl_FragCoord.xy, fragCenter);
    float falloff = 20.0 * radius * clamp(0.0, 1.0 / dist, 1.0);
    fragColor = vec4(color,1.0) * falloff;
}