#version 300 es

precision highp float;

out vec4 fragColor;

uniform vec3 color;
uniform sampler2D lensFlareTexture;

void main(void) {
    float dist = distance(gl_PointCoord, vec2(0.5));
    dist = smoothstep(0.0, 0.5, dist);

    float alpha = texture(lensFlareTexture, gl_PointCoord).a;
    vec3 gradient = mix(vec3(1), color, dist);

    fragColor = vec4(gradient, alpha);
}
