#version 300 es

precision highp float;

in vec2 texturePosition;

out vec4 fragColor;

uniform sampler2D textureImage;
uniform int width;
uniform int height;

const float FXAA_EDGE_THRESHOLD  = 0.125;
const float FXAA_EDGE_THRESHOLD_MIN = 0.0625;
const int FXAA_SEARCH_STEPS = 3;

// Luminance conversion
// http://developer.download.nvidia.com/assets/gamedev/files/sdk/11/FXAA_WhitePaper.pdf
float luma(vec4 rgba) {
    return rgba.g * (0.587/0.299) + rgba.x;
}

vec2 textureCoordOffset(vec2 position, vec2 offset) {
    float x = offset.x / float(width);
    float y = offset.y / float(height);

    return position + vec2(x, y);
}

mat3 lumaMatrix(void) {
    mat3 matrix;

    for (int row = 0; row < 3; row++) {
        for (int col = 0; col < 3; col++) {
            vec2 textureCoord = textureCoordOffset(texturePosition, vec2(row - 1, col - 1));
            matrix[col][row] = luma(texture(textureImage, textureCoord));
        }
    }

    return matrix;
}

float weightedAvgMagnitude(mat3 weights, mat3 lumaMat) {
    float avg = 0.0;

    for (int i = 0; i < 3; i++) {
        avg += abs(dot(lumaMat[i], weights[i]));
    }

    return avg;
}

bool isHorizontalEdge(mat3 lumaMat) {
    const mat3 weights = mat3(
        0.25, -0.5, 0.25,
        0.5, -1, 0.5,
        0.25, -0.5, 0.25
    );

    float edgeVert = weightedAvgMagnitude(weights, lumaMat);
    float edgeHorz = weightedAvgMagnitude(weights, transpose(lumaMat));

    return edgeHorz >= edgeVert;
}

struct EdgeEnd {
    vec2 negative;
    vec2 positive;
};

EdgeEnd endOfEdgeSearch(mat3 lumaMat) {
    float lumaN, lumaP;
    vec2 offset;

    if (isHorizontalEdge(lumaMat)) {
        lumaN = lumaMat[1][2]; // south
        lumaP = lumaMat[1][0]; // north
        offset = vec2(0, -1);
    } else {
        lumaN = lumaMat[0][1]; // west
        lumaP = lumaMat[2][1]; // east
        offset = vec2(1, 0);
    }

    vec2 posN = textureCoordOffset(texturePosition, offset * -1.0);
    vec2 posP = textureCoordOffset(texturePosition, offset);

    float gradientN = abs(lumaN - lumaMat[1][1]);
    float gradientP = abs(lumaP - lumaMat[1][1]);
    if (gradientP < gradientN) {
        offset *= -1.0;
    }

    bool  doneN, doneP;
    float lumaEndN, lumaEndP;

    for (int i = 0; i < FXAA_SEARCH_STEPS; i++) {
        if (!doneN) {
            lumaEndN = luma(texture(textureImage, textureCoordOffset(posN, offset)));
        }
        if (!doneP) {
            lumaEndP = luma(texture(textureImage, textureCoordOffset(posP, offset)));
        }

        doneN = doneN || abs(lumaEndN - lumaN) >= gradientN;
        doneP = doneP || abs(lumaEndP - lumaP) >= gradientP;

        if (doneN && doneP) {
            break;
        }

        if (!doneN) {
            posN -= offset;
        }
        if (!doneP) {
            posP += offset;
        }
    }

    EdgeEnd end;
    end.negative = posN;
    end.positive = posP;

    return end;
}

void main(void) {
    vec4 rgba = texture(textureImage, texturePosition);

    // Matrices are column-major.
    mat3 lm = lumaMatrix();

    // Local contrast check
    float rangeMin = min(lm[1][1], min(min(lm[1][0], lm[0][1]), min(lm[1][2], lm[2][1])));
    float rangeMax = max(lm[1][1], max(max(lm[1][0], lm[0][1]), max(lm[1][2], lm[2][1])));

    float range = rangeMax - rangeMin;

    if(range < max(FXAA_EDGE_THRESHOLD_MIN, rangeMax * FXAA_EDGE_THRESHOLD)) {
        fragColor = rgba;
    } else {
        if (isHorizontalEdge(lm)) {
            fragColor = vec4(1, 1, 0, 1);
        } else {
            fragColor = vec4(0, 1, 1, 1);
        }
    }
}