precision highp float;
uniform sampler2D u_image;
uniform sampler2D u_next;
uniform float u_hasNext;
uniform float u_swap;
uniform sampler2D u_frame;
uniform sampler2D u_text;
uniform sampler2D u_reveal;
uniform float u_revealAlpha;
uniform float u_hasFrame;
uniform vec2 u_frameScale;
uniform float u_key;
uniform float u_flash;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_blocks;
uniform float u_tear;
uniform float u_rgb;
uniform float u_noise;
uniform float u_scan;
uniform float u_shake;
uniform float u_invert;
uniform float u_pixel;
uniform float u_video;
uniform float u_flickerOn;
uniform float u_flickerSeed;
uniform float u_tearOn;
uniform float u_tearSeed;
uniform float u_tearAmount;
uniform float u_blocksOn;
uniform float u_blocksSeed;
uniform float u_blocksAmount;
varying vec2 v_uv;

float hash(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

float hash1(float x) {
    return hash(vec2(x, 17.31));
}

float burst(float rate, float amount, float salt) {
    return step(1.0 - amount, hash1(floor(u_time * rate) + salt));
}

vec3 picture(vec2 uv, float swapped) {
    return mix(texture2D(u_image, uv).rgb, texture2D(u_next, uv).rgb, swapped);
}

void main() {
    vec2 uv = v_uv;

    float shakeSlot = floor(u_time * 30.0);
    uv += (vec2(hash1(shakeSlot), hash1(shakeSlot + 7.0)) - 0.5) * u_shake * 0.02;

    float flickerSlot = u_flickerSeed;
    float bandHeight = mix(0.003, 0.05, hash1(flickerSlot + 3.0));
    float band = step(abs(uv.y - hash1(flickerSlot + 5.0)), bandHeight);
    uv.x += u_flickerOn * band * (hash1(flickerSlot + 9.0) - 0.5) * 0.1;

    float tearSlot = u_tearSeed;
    float row = floor(uv.y * mix(8.0, 48.0, hash1(tearSlot + 2.0)));
    float torn = u_tearOn * step(1.0 - u_tearAmount, hash(vec2(row, tearSlot)));
    uv.x += torn * (hash(vec2(row, tearSlot + 1.0)) - 0.5) * 0.35 * u_tear;

    float blocks = u_blocks;
    float blockSlot = u_blocksSeed;
    vec2 block = floor(uv * vec2(16.0, 9.0) * mix(0.5, 2.5, hash1(blockSlot + 4.0)));
    float blockOn = u_blocksOn * step(1.0 - u_blocksAmount, hash(block + blockSlot));
    uv += blockOn * (vec2(hash(block + blockSlot + 1.0), hash(block + blockSlot + 2.0)) - 0.5) * 0.25 * blocks;

    float pixelOn = burst(6.0, u_pixel, 11.0);
    vec2 grid = u_resolution / mix(4.0, 32.0, hash1(floor(u_time * 6.0) + 13.0));
    uv = mix(uv, (floor(uv * grid) + 0.5) / grid, pixelOn);

    float swapped = u_hasNext * step(hash(floor(v_uv * vec2(24.0, 14.0)) + 91.0), u_swap);
    float split = u_rgb * (0.4 + hash1(floor(u_time * 20.0) + 15.0));
    vec3 color = vec3(
        picture(uv + vec2(split, 0.0), swapped).r,
        picture(uv, swapped).g,
        picture(uv - vec2(split, 0.0), swapped).b
    );

    color = mix(color, color.gbr, blockOn * blocks * step(0.5, hash(block + blockSlot + 3.0)));

    vec2 frameUv = (v_uv - 0.5) * u_frameScale + 0.5;
    vec3 frame = vec3(
        texture2D(u_frame, frameUv + vec2(split, 0.0)).r,
        texture2D(u_frame, frameUv).g,
        texture2D(u_frame, frameUv - vec2(split, 0.0)).b
    );
    float windowed = max(
        blockOn * step(hash(block + blockSlot + 5.0), u_video),
        torn * step(hash(vec2(row, tearSlot + 4.0)), u_video * 0.5)
    );
    float shown = u_hasFrame * max(windowed, burst(15.0, u_flash, 31.0));
    float keyed = mix(1.0, smoothstep(0.06, 0.35, dot(frame, vec3(0.299, 0.587, 0.114))), u_key);
    color = mix(color, frame, shown * keyed);

    vec2 revealUv = mix(v_uv, uv, 0.6);
    vec4 revealR = texture2D(u_reveal, revealUv + vec2(split, 0.0));
    vec4 revealG = texture2D(u_reveal, revealUv);
    vec4 revealB = texture2D(u_reveal, revealUv - vec2(split, 0.0));
    color = vec3(
        mix(color.r, revealR.r, revealR.a * u_revealAlpha),
        mix(color.g, revealG.g, revealG.a * u_revealAlpha),
        mix(color.b, revealB.b, revealB.a * u_revealAlpha)
    );

    vec2 textUv = mix(v_uv, uv, 0.35);
    vec4 textR = texture2D(u_text, textUv + vec2(split, 0.0));
    vec4 textG = texture2D(u_text, textUv);
    vec4 textB = texture2D(u_text, textUv - vec2(split, 0.0));
    color = vec3(
        mix(color.r, textR.r, textR.a),
        mix(color.g, textG.g, textG.a),
        mix(color.b, textB.b, textB.a)
    );

    float invertOn = max(burst(9.0, u_invert, 21.0), step(0.999, u_invert));
    color = mix(color, 1.0 - color, invertOn);

    color *= 1.0 - u_scan * 0.35 * step(0.5, fract(gl_FragCoord.y * 0.5));
    color = mix(color, vec3(hash(gl_FragCoord.xy + fract(u_time) * 100.0)), u_noise * 0.6);

    gl_FragColor = vec4(color, 1.0);
}
