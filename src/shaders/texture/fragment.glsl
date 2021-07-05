#version 300 es

precision highp float;

in vec2 texturePosition;

out vec4 fragColor;

uniform sampler2D textureImage;
uniform int width;
uniform int height;

const float FXAA_EDGE_THRESHOLD  = 0.125;
const float FXAA_EDGE_THRESHOLD_MIN = 0.0625;

// Luminance conversion
// http://developer.download.nvidia.com/assets/gamedev/files/sdk/11/FXAA_WhitePaper.pdf
float luma(vec4 rgba) {
    return rgba.g * (0.587/0.299) + rgba.x;
}

bool inTextureCoordRange(float v) {
    return v >= 0.0 && v <= 1.0;
}

vec4 neighborTexture(int xShift, int yShift) {
    float x = float(xShift) / float(width);
    float y = float(yShift) / float(height);

    vec2 coords = texturePosition + vec2(x, y);
    if (inTextureCoordRange(coords.x)  && inTextureCoordRange(coords.y)) {
        return texture(textureImage, coords);
    }

    return vec4(0.0);
}

mat3 lumaMatrix(void) {
    mat3 matrix;

    for (int row = 0; row < 3; row++) {
        for (int col = 0; col < 3; col++) {
            matrix[col][row] = luma(neighborTexture(col - 1, row - 1));
        }
    }

    return matrix;
}

void main(void) {
    vec4 rgba = texture(textureImage, texturePosition);

    mat3 lm = lumaMatrix();

    // Local contrast check
    float rangeMin = min(lm[1][1], min(min(lm[1][0], lm[0][1]), min(lm[1][2], lm[2][1])));
    float rangeMax = max(lm[1][1], max(max(lm[1][0], lm[0][1]), max(lm[1][2], lm[2][1])));
    float range = rangeMax - rangeMin;

    //if(range < max(FXAA_EDGE_THRESHOLD_MIN, rangeMax * FXAA_EDGE_THRESHOLD)) {
        //fragColor = fxaaFilter(rgba);
    //}

    fragColor = rgba;
}