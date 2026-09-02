precision mediump float;
uniform sampler2D u_texture;
uniform vec4 u_tint;
uniform vec4 u_edge;
uniform vec2 u_shade;
varying vec2 v_uv;
varying vec2 v_ref;

void main() {
    vec4 color = texture2D(u_texture, v_uv) * u_tint;

    if (u_edge.w > 0.5) {
        float distance = v_ref.x - (u_edge.x + (v_ref.y - u_edge.y) * u_edge.z);

        if (distance < 0.0) discard;

        color.rgb *= clamp(u_shade.y + (1.0 - u_shade.y) * distance / u_shade.x, u_shade.y, 1.0);
    }

    gl_FragColor = color;
}
