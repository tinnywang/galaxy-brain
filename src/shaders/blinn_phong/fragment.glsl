#version 300 es

precision highp float;

in float fragDepth;
in vec3 fragNormal;
in vec4 fragPosition;

out vec4 fragColor;

uniform vec3 color;
uniform vec3 eye;

uniform struct Light {
    vec3 position;
    vec3 color;
    float intensity;
} light;

uniform struct Material {
    vec3 ambient;
    vec3 diffuse;
    vec3 specular;
    float specularExponent;
} material;

void main(void) {
    gl_FragDepth = fragDepth;

    vec3 position = fragPosition.xyz / fragPosition.w;
    vec3 eyeDirection = normalize(eye - position);
    vec3 lightDirection = normalize(light.position - position);

    vec3 diffuse = material.diffuse * light.intensity * max(dot(lightDirection, fragNormal), 0.0);
    vec3 reflection = normalize(reflect(-lightDirection, fragNormal));
    vec3 specular = material.specular * light.intensity * pow(max(dot(reflection, eyeDirection), 0.0), material.specularExponent);

    fragColor = vec4(diffuse + specular + material.ambient, 1.0);
}
