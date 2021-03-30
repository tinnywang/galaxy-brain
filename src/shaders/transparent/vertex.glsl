attribute vec4 vertexPosition;

uniform mat4 modelViewProjectionMatrix;

varying highp vec2 texturePosition;

void main(void) {
    gl_Position = modelViewProjectionMatrix * vertexPosition;

    // gl_Position coordinates are in the range [-1, 1].
    // Texture coordinates should be in the range [0, 1].
    texturePosition = gl_Position.xy / gl_Position.w * 0.5 + 0.5;
}