#version 300 es

precision highp float;

in float fragDepth;
in vec3 fragNormal;
in vec4 fragPosition;

out vec4 fragColor;

uniform vec3 color;
uniform vec3 eye;

struct Light {
    vec3 position;
    vec3 color;
    float intensity;
};

struct Material {
    vec3 ambient;
    vec3 diffuse;
    vec3 specular;
    float specularExponent;
};

void main(void) {
    gl_FragDepth = fragDepth;

    // TODO: Don't hard code light.
    Light light;
    light.position = vec3(0, 10, -10);
    light.color = vec3(1, 1, 1);
    light.intensity = 0.5;

    vec3 position = fragPosition.xyz / fragPosition.w;
    vec3 eyeDirection = normalize(eye - position);
    vec3 lightDirection = normalize(light.position - position);

    // TODO: Don't hard code material.
    Material material;
    material.ambient = color;
    material.diffuse = color;
    material.specular = vec3(1, 1, 1);
    material.specularExponent = 1.0;

    vec3 diffuse = material.diffuse * light.intensity * max(dot(lightDirection, fragNormal), 0.0);
    vec3 reflection = normalize(reflect(-lightDirection, fragNormal));
    vec3 specular = material.specular * light.intensity * pow(max(dot(reflection, eyeDirection), 0.0), material.specularExponent);

    fragColor = vec4(diffuse + specular + material.ambient, 1.0);
}
