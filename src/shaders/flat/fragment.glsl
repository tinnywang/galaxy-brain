#version 300 es

precision highp float;

in float fragDepth;

out vec4 fragColor;

uniform vec3 color;

void main(void) {
    gl_FragDepth = fragDepth;
    fragColor = vec4(color, 1.0);
}