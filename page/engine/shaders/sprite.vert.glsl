attribute vec2 a_unit;
uniform vec4 u_rect;
uniform vec4 u_uv;
varying vec2 v_uv;

void main() {
    v_uv = mix(u_uv.xy, u_uv.zw, a_unit);
    gl_Position = vec4(mix(u_rect.xy, u_rect.zw, a_unit), 0.0, 1.0);
}
