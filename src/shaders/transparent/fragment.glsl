uniform sampler2D depthTexture;
uniform highp vec3 color;

varying highp vec2 depthPosition;


void main(void) {
    if (gl_FragCoord.z <= texture2D(depthTexture, depthPosition).z) {
        discard;
    } else {
        gl_FragColor = vec4(color, 0.5);
    }
}
