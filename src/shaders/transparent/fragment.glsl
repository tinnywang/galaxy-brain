uniform sampler2D colorTexture;

varying highp vec2 texturePosition;


void main(void) {
    gl_FragColor = texture2D(colorTexture, texturePosition);
}
