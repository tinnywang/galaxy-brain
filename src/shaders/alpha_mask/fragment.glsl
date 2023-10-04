#version 300 es

precision highp float;

out vec4 fragColor;

uniform float alpha;

void main(void) {
    fragColor = vec4(alpha);
}