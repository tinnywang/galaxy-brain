uniform sampler2D imageTexture;
varying highp vec2 texturePosition;

void main(void) {
    gl_FragColor = texture2D(imageTexture, texturePosition);
}