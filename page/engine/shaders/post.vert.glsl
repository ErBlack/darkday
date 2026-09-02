attribute vec2 a_unit;
varying vec2 v_uv;

void main() {
    v_uv = a_unit;
    gl_Position = vec4(a_unit * 2.0 - 1.0, 0.0, 1.0);
}
