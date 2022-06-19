#version 300 es

precision highp float;

in vec2 texturePosition;

out vec4 fragColor;

uniform sampler2D textureImage;

const float FXAA_EDGE_THRESHOLD  = 0.125;
const float FXAA_EDGE_THRESHOLD_MIN = 0.0625;

// Luminance conversion
// http://developer.download.nvidia.com/assets/gamedev/files/sdk/11/FXAA_WhitePaper.pdf
float luminance(vec4 rgba) {
    return rgba.g * (0.587/0.299) + rgba.x;
}

vec2 texelSize(void) {
    ivec2 ts = textureSize(textureImage, 0);
    return 1.0 / vec2(ts);
}

vec4 textureAtOffset(float x, float y) {
    vec2 ts = texelSize();
    vec2 coords = texturePosition + vec2(x * ts.x, y * ts.y);
    return texture(textureImage, coords);
}

struct Luma {
    float n, s, e, w, ne, nw, se, sw, m;
    float min, max, range;
};

Luma getLuma(void) {
    Luma luma;

    luma.n = luminance(textureAtOffset(0.0, 1.0));
    luma.s = luminance(textureAtOffset(0.0, -1.0));
    luma.e = luminance(textureAtOffset(1.0, 0.0));
    luma.w = luminance(textureAtOffset(-1.0, 0.0));
    luma.ne = luminance(textureAtOffset(1.0, 1.0));
    luma.nw = luminance(textureAtOffset(-1.0, 1.0));
    luma.se = luminance(textureAtOffset(1.0, -1.0));
    luma.sw = luminance(textureAtOffset(-1.0, -1.0));
    luma.m = luminance(textureAtOffset(0.0, 0.0));

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

void main(void) {
    vec4 rgba = texture(textureImage, texturePosition);

    Luma luma = getLuma();
    if (luma.range < max(FXAA_EDGE_THRESHOLD_MIN, luma.max * FXAA_EDGE_THRESHOLD)) {
      fragColor = rgba;
    } else {
        if (isHorizontalEdge(luma)) {
            fragColor = vec4(1, 1, 0, 1);
        } else {
            fragColor = vec4(0, 1, 1, 1);
        }
    }
}