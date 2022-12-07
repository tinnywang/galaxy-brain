#version 300 es

#define NUM_LIGHTS ${numLights}

precision highp float;

in float fragDepth;
in vec3 fragNormal;
in vec4 fragPosition;

out vec4 fragColor;

uniform vec3 eye;

uniform struct Light {
    vec3 position;
    vec3 color;
    float power;
} lights[NUM_LIGHTS];

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

    for (int i = 0; i < NUM_LIGHTS; i++) {
        Light light = lights[i];
        vec3 lightDirection = normalize(light.position - position);
        float lightDistance = length(light.position - position);
        vec3 lightColor = light.color * light.power / (lightDistance * lightDistance);

        float lambertian = max(dot(lightDirection, fragNormal), 0.0);
        float specular = 0.0;

        if (lambertian > 0.0) {
            vec3 reflection = normalize(reflect(-lightDirection, fragNormal));
            specular = pow(max(dot(reflection, eyeDirection), 0.0), material.specularExponent);
        }

        vec3 color = material.ambient +
            material.diffuse * lambertian * lightColor +
            material.specular * specular * lightColor;

        fragColor += vec4(color, 1);
    }
}