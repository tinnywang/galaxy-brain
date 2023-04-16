#version 300 es

precision highp float;

out vec4 fragColor;

uniform vec3 color;

void main(void) {
    /*
    float dist = distance(gl_PointCoord, vec2(0.5));
    dist = smoothstep(0.0, 0.5, dist);
    */

    fragColor = vec4(color, 1);
}
