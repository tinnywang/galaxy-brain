#version 300 es

precision highp float;

in vec2 texturePosition;

out vec4 fragColor;

uniform sampler2D textureImage;

const int FXAA_SEARCH_STEPS = 3;
const float FXAA_EDGE_THRESHOLD = 0.125;
const float FXAA_EDGE_THRESHOLD_MIN = 0.0625;
const float FXAA_SUBPIX_TRIM = 0.25;
const float FXAA_SUBPIX_TRIM_SCALE = 1.0/(1.0 - FXAA_SUBPIX_TRIM);
const float FXAA_SUBPIX_CAP = 0.75;

// Luminance conversion
// http://developer.download.nvidia.com/assets/gamedev/files/sdk/11/FXAA_WhitePaper.pdf
float luminance(vec4 rgba) {
    return rgba.g * (0.587/0.299) + rgba.x;
}

vec2 texelSize(void) {
    ivec2 ts = textureSize(textureImage, 0);
    return 1.0 / vec2(ts);
}

vec4 textureAtOffset(vec2 offset) {
    vec2 ts = texelSize();
    vec2 coords = texturePosition + vec2(offset.x * ts.x, offset.y * ts.y);
    return texture(textureImage, coords);
}

struct Luma {
    float n, s, e, w, ne, nw, se, sw, m;
    float min, max, range;
};

Luma getLuma(void) {
    Luma luma;

    luma.n = luminance(textureAtOffset(vec2(0, 1)));
    luma.s = luminance(textureAtOffset(vec2(0, -1)));
    luma.e = luminance(textureAtOffset(vec2(1, 0)));
    luma.w = luminance(textureAtOffset(vec2(-1, 0)));
    luma.ne = luminance(textureAtOffset(vec2(1, 1)));
    luma.nw = luminance(textureAtOffset(vec2(-1, -1)));
    luma.se = luminance(textureAtOffset(vec2(1, -1)));
    luma.sw = luminance(textureAtOffset(vec2(-1, -1)));
    luma.m = luminance(textureAtOffset(vec2(0, 0)));

    // Calculate local contrast.
    luma.min = min(luma.m, min(min(luma.n, luma.w), min(luma.e, luma.s)));
    luma.max = max(luma.m, max(max(luma.n, luma.w), max(luma.e, luma.s)));
    luma.range = luma.max - luma.min;

    return luma;
}

bool isHorizontalEdge(Luma luma) {
    float vertical = abs(0.25 * luma.nw - 0.5 * luma.n + 0.25 * luma.ne) +
        abs(0.5 * luma.w - luma.m + 0.5 * luma.e) +
        abs(0.25 * luma.sw - 0.5 * luma.s + 0.25 * luma.se);
    float horizontal = abs(0.25 * luma.nw - 0.5 * luma.w + 0.25 * luma.sw) +
        abs(0.5 * luma.n - luma.m + 0.5 * luma.s) +
        abs(0.25 * luma.ne - 0.5 * luma.e + 0.25 * luma.se);
    return horizontal >= vertical;
}

float subPixelBlendFactor(Luma luma) {
    float lumaL = (luma.n + luma.w + luma.e + luma.s) * 0.25;
    float rangeL = abs(lumaL - luma.m);
    float blendL = max(0.0, (rangeL / luma.range) - FXAA_SUBPIX_TRIM) * FXAA_SUBPIX_TRIM_SCALE;
    return min(FXAA_SUBPIX_CAP, blendL);
}

struct Edge {
    bool isHorizontal;
    vec2 perpendicularOffset;
    vec2 parallelOffset;
    vec2 fxaaOffset;
};

Edge getEdge(Luma luma) {
    Edge edge;
    edge.isHorizontal = isHorizontalEdge(luma);

    float lumaN, lumaP;
    float gradientN, gradientP;

    if (edge.isHorizontal) {
        edge.perpendicularOffset = vec2(0, 1);
        edge.parallelOffset = vec2(1, 0);
        lumaN = 0.5 * (luma.s + luma.m);
        lumaP = 0.5 * (luma.n + luma.m);
        gradientN = abs(luma.s - luma.m);
        gradientP = abs(luma.n - luma.m);
    } else {
        edge.perpendicularOffset = vec2(1, 0);
        edge.parallelOffset = vec2(0, 1);
        lumaN = 0.5 * (luma.w + luma.m);
        lumaP = 0.5 * (luma.e + luma.m);
        gradientN = abs(luma.w - luma.m);
        gradientP = abs(luma.e - luma.m);
    }

    float gradientScaled = 0.25 * max(gradientN, gradientP);

    if (gradientP < gradientN) {
        edge.perpendicularOffset *= -1.0;
    }

    float lumaEndN, lumaEndP;
    bool doneN, doneP;
    vec2 offsetN = -1.0 * edge.parallelOffset;
    vec2 offsetP = edge.parallelOffset;

    for (int i = 0; i < FXAA_SEARCH_STEPS; i++) {
        if (!doneN) {
            lumaEndN = luminance(textureAtOffset(offsetN + 0.5 * edge.perpendicularOffset));
        }
        if (!doneP) {
            lumaEndP = luminance(textureAtOffset(offsetP + 0.5 * edge.perpendicularOffset));
        }
         doneN = doneN || abs(lumaEndN - lumaN) >= gradientScaled;
         doneP = doneP || abs(lumaEndP - lumaP) >= gradientScaled;
        if (doneN && doneP) {
            break;
        }
        if (!doneN) {
            offsetN -= edge.parallelOffset;
        }
        if (!doneP) {
            offsetP += edge.parallelOffset;
        }
    }

    float distN, distP;
    if (edge.isHorizontal) {
        distN = abs(offsetN.x);
        distP = abs(offsetP.x);
    } else {
        distN = abs(offsetN.y);
        distP = abs(offsetP.y);
    }

    float lumaAvg, lumaEnd;
    if (distN < distP) {
        lumaAvg = lumaN;
        lumaEnd = lumaEndN - lumaN;
    } else {
        lumaAvg = lumaP;
        lumaEnd = lumaEndP - lumaP;
    }

    vec2 offset = (lumaEnd < 0.0) != (luma.m < lumaAvg) ? edge.perpendicularOffset : vec2(0, 0);
    float edgeBlend = 0.5 - min(distN, distP) / (distN + distP);

    edge.fxaaOffset = offset * max(edgeBlend, subPixelBlendFactor(luma));
    return edge;
}


void main(void) {
    vec4 rgba = texture(textureImage, texturePosition);

    Luma luma = getLuma();
    if (luma.range < max(FXAA_EDGE_THRESHOLD_MIN, luma.max * FXAA_EDGE_THRESHOLD)) {
        fragColor = rgba;
    } else {
        Edge edge = getEdge(luma);
        fragColor = textureAtOffset(edge.fxaaOffset);
    }
}