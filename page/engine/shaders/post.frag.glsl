precision mediump float;
uniform sampler2D u_scene;
uniform vec2 u_resolution;
uniform float u_dpr;
uniform float u_seed;
uniform float u_blur;
uniform float u_grain;
uniform vec2 u_vignette;
varying vec2 v_uv;

float hash(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

vec3 overlay(vec3 base, float gray) {
    vec3 low = 2.0 * base * gray;
    vec3 high = 1.0 - 2.0 * (1.0 - base) * (1.0 - gray);
    return mix(low, high, step(0.5, base));
}

void main() {
    vec2 texel = 1.0 / u_resolution;
    vec3 color = vec3(0.0);
    float total = 0.0;

    for (int i = -1; i <= 1; i++) {
        for (int j = -1; j <= 1; j++) {
            vec2 offset = vec2(float(i), float(j)) * u_blur * texel;
            float weight = exp(-float(i * i + j * j) * 0.5);
            color += texture2D(u_scene, v_uv + offset).rgb * weight;
            total += weight;
        }
    }

    color /= total;

    float t = length((v_uv - 0.5) * 2.0) / 1.41421356;
    float shade = clamp((t - u_vignette.x) / (1.0 - u_vignette.x), 0.0, 1.0) * u_vignette.y;
    color *= 1.0 - shade;

    vec2 cell = floor(gl_FragCoord.xy / u_dpr) + u_seed;
    float gray = 0.5 + (hash(cell) - 0.5) * 0.55;
    color = mix(color, overlay(color, gray), u_grain);

    gl_FragColor = vec4(color, 1.0);
}
