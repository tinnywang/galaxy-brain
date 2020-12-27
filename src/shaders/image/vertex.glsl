attribute vec2 vertexPosition;

varying highp vec2 texturePosition;

const vec2 scale = vec2(0.5, 0.5);

void main(void) {
    // gl_Position coordinates are in the range [-1, 1].
    gl_Position = vec4(vertexPosition, 0, 1);

    // Texture coordinates are in the range [0, 1].
    texturePosition = vertexPosition * scale + scale;
}