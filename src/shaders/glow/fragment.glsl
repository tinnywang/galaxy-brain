#version 300 es

precision highp float;

in float fragDepth;

out vec4 fragColor;

uniform vec3 color;

void main(void) {
    gl_FragDepth = fragDepth;

    float dist = distance(gl_PointCoord, vec2(0.5, 0.5));
    float falloff = 1.0 - smoothstep(0.0, 0.5, dist);
    float alpha = pow(falloff, dist);

    vec4 innerColor = vec4(1, 1, 1, alpha);
    vec4 outerColor = vec4(color, alpha);

    fragColor = mix(outerColor, innerColor, falloff);
}