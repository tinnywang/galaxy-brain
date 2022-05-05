#version 300 es

precision highp float;

in vec2 texturePosition;

out vec4 fragColor;

uniform sampler2D textureImage;

const float FXAA_EDGE_THRESHOLD  = 0.125;
const float FXAA_EDGE_THRESHOLD_MIN = 0.0625;
const int FXAA_SEARCH_STEPS = 3;
const float FXAA_SUBPIX_TRIM = 0.25;
const float FXAA_SUBPIX_TRIM_SCALE =  1.0; // TODO: figure out appropriate value.
const float FXAA_SUBPIX_CAP = 0.75;

// Luminance conversion
// http://developer.download.nvidia.com/assets/gamedev/files/sdk/11/FXAA_WhitePaper.pdf
float luma(vec4 rgba) {
    return rgba.g * (0.587/0.299) + rgba.x;
}

vec2 textureCoordOffset(vec2 position, vec2 offset) {
    ivec2 ts = textureSize(textureImage, 0);
    float x = offset.x / float(ts.x);
    float y = offset.y / float(ts.y);

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
    vec2 pixelOffset;
};

EdgeEnd endOfEdgeSearch(mat3 lumaMat) {
    vec2 texelSize = 1.0 / vec2(textureSize(textureImage, 0));
    float lumaN, lumaP;
    vec2 pixelOffset, edgeOffset;

    // TODO: check pixelOffset for horiztonal edge. Should it be negated from the get-go?
    if (isHorizontalEdge(lumaMat)) {
        lumaN = lumaMat[1][2]; // south
        lumaP = lumaMat[1][0]; // north
        pixelOffset = vec2(0, -texelSize.y);
        edgeOffset = vec2(texelSize.x, 0);
    } else {
        lumaN = lumaMat[0][1]; // west
        lumaP = lumaMat[2][1]; // east
        pixelOffset = vec2(texelSize.x, 0);
        edgeOffset = vec2(0, -texelSize.y);
    }

    float gradientN = abs(lumaN - lumaMat[1][1]);
    float gradientP = abs(lumaP - lumaMat[1][1]);
    if (gradientP < gradientN) {
        pixelOffset *= -1.0;
    }

    vec2 posN = texturePosition;
    vec2 posP = texturePosition;
    bool  doneN, doneP;
    float lumaEndN, lumaEndP;

    for (int i = 0; i < FXAA_SEARCH_STEPS; i++) {
        if (!doneN) {
            lumaEndN = luma(texture(textureImage, posN - edgeOffset));
        }
        if (!doneP) {
            lumaEndP = luma(texture(textureImage, posP + edgeOffset));
        }

        doneN = doneN || abs(lumaEndN - lumaN) >= gradientN;
        doneP = doneP || abs(lumaEndP - lumaP) >= gradientP;

        if (doneN && doneP) {
            break;
        }

        if (!doneN) {
            posN -= edgeOffset;
        }
        if (!doneP) {
            posP += edgeOffset;
        }
    }

    EdgeEnd end;
    end.negative = posN;
    end.positive = posP;
    end.pixelOffset = pixelOffset;

    return end;
}

float blendFactor(mat3 lumaMat, float localContrast) {
    float lumaLowpass = (lumaMat[0][0] + lumaMat[1][2] + lumaMat[2][1] + lumaMat[0][1]) * 0.25;
    float pixelContrast = abs(lumaLowpass - lumaMat[1][1]);
    float blend = max(0.0, (pixelContrast / localContrast) - FXAA_SUBPIX_TRIM) * FXAA_SUBPIX_TRIM_SCALE;
    return min(FXAA_SUBPIX_CAP, blend);
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
        float blend = blendFactor(lm, range);
        EdgeEnd end = endOfEdgeSearch(lm);
        float distance;
        float edgeBlend;

        if (isHorizontalEdge(lm)) {
            distance = min(texturePosition.x - end.negative.x, end.positive.x - texturePosition.x);
            edgeBlend = 0.5 - distance / (end.positive.x - end.negative.x);
        } else {
            distance = min(end.negative.y - texturePosition.y, texturePosition.y - end.positive.y);
            edgeBlend = 0.5 - distance / (end.negative.y - end.positive.y);
        }

        fragColor = texture(textureImage, texturePosition + end.pixelOffset * edgeBlend);
    }
}