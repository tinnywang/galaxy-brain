uniform sampler2D depthTexture;
uniform highp vec3 color;
uniform bool shouldDepthPeel;
uniform highp float width;
uniform highp float height;

void main(void) {
    highp float d = texture2D(depthTexture, vec2(gl_FragCoord.x / width, gl_FragCoord.y / height)).r;
    if (shouldDepthPeel && gl_FragCoord.z <= d) {
        discard;
    } else {
        gl_FragColor = vec4(color, 1);
    }
}
