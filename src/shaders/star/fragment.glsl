#version 300 es

precision highp float;

in mat2 rotationMatrix;

out vec4 fragColor;

uniform vec3 color;
uniform sampler2D lensFlareTexture;

const vec2 center = vec2(0.5);

void main(void) {
    float dist = distance(gl_PointCoord, center);
    dist = smoothstep(0.0, 0.5, dist);

    vec2 textureCoord = gl_PointCoord - center;
    textureCoord *= rotationMatrix;
    textureCoord += center;

    float alpha = texture(lensFlareTexture, textureCoord).a;
    vec3 gradient = mix(vec3(1), color, dist);

    fragColor = vec4(gradient, alpha);
}
