attribute vec2 a_unit;
uniform vec2 u_origin;
uniform vec2 u_axis_x;
uniform vec2 u_axis_y;
uniform vec2 u_ref_origin;
uniform vec2 u_ref_axis_x;
uniform vec2 u_ref_axis_y;
uniform vec4 u_uv;
varying vec2 v_uv;
varying vec2 v_ref;

void main() {
    v_uv = mix(u_uv.xy, u_uv.zw, a_unit);
    v_ref = u_ref_origin + a_unit.x * u_ref_axis_x + a_unit.y * u_ref_axis_y;
    gl_Position = vec4(u_origin + a_unit.x * u_axis_x + a_unit.y * u_axis_y, 0.0, 1.0);
}
