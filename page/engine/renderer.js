import { createProgram, createTexture, createUnitQuad } from './gl.js';
import SPRITE_VERTEX from './shaders/sprite.vert.glsl?raw';
import SPRITE_FRAGMENT from './shaders/sprite.frag.glsl?raw';
import POST_VERTEX from './shaders/post.vert.glsl?raw';
import POST_FRAGMENT from './shaders/post.frag.glsl?raw';

const REF = { width: 2912, height: 1632 };
const MAX_DPR = 2;
const GRAIN_FPS = 24;

export class Renderer {
    #canvas;
    #gl;
    #sprite;
    #post;
    #quad;
    #white;
    #framebuffer;
    #scene;
    #textures = new WeakMap();
    #layers = [];
    #frame = null;
    #last = 0;
    #seed = 0;
    #grainTimer = null;

    view = { dpr: 1, scale: 1, x: 0, y: 0, width: 0, height: 0 };

    constructor(canvas) {
        this.#canvas = canvas;

        const gl = canvas.getContext('webgl', { alpha: false, antialias: false, premultipliedAlpha: false });
        this.#gl = gl;
        this.#sprite = createProgram(gl, SPRITE_VERTEX, SPRITE_FRAGMENT);
        this.#post = createProgram(gl, POST_VERTEX, POST_FRAGMENT);
        this.#quad = createUnitQuad(gl);

        this.#white = createTexture(gl);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255, 255, 255, 255]));

        this.#scene = createTexture(gl);
        this.#framebuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.#framebuffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.#scene, 0);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        addEventListener('resize', () => this.resize());
        this.resize();
    }

    get canvas() {
        return this.#canvas;
    }

    resize() {
        const gl = this.#gl;
        const dpr = Math.min(devicePixelRatio || 1, MAX_DPR);
        const width = innerWidth;
        const height = innerHeight;

        this.#canvas.width = Math.round(width * dpr);
        this.#canvas.height = Math.round(height * dpr);
        this.#canvas.style.width = `${width}px`;
        this.#canvas.style.height = `${height}px`;

        gl.bindTexture(gl.TEXTURE_2D, this.#scene);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.#canvas.width, this.#canvas.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

        const scale = Math.max(width / REF.width, height / REF.height);

        this.view = {
            dpr,
            scale,
            width,
            height,
            x: (width - REF.width * scale) / 2,
            y: (height - REF.height * scale) / 2,
        };

        this.invalidate();
    }

    toRef(clientX, clientY) {
        return {
            x: (clientX - this.view.x) / this.view.scale,
            y: (clientY - this.view.y) / this.view.scale,
        };
    }

    setLayers(layers) {
        this.#layers = [...layers];
        this.invalidate();
    }

    setGrainAnimated(animated) {
        clearInterval(this.#grainTimer);
        this.#grainTimer = animated ? setInterval(() => this.invalidate(), 1000 / GRAIN_FPS) : null;
    }

    invalidate() {
        if (this.#frame === null) {
            this.#last = performance.now();
            this.#frame = requestAnimationFrame(this.#tick);
        }
    }

    #tick = now => {
        this.#frame = null;

        const dt = Math.min(now - this.#last, 100);
        this.#last = now;

        let alive = false;

        for (const layer of this.#layers) {
            if (layer.update?.(dt)) alive = true;
        }

        this.#draw();

        if (alive) this.#frame = requestAnimationFrame(this.#tick);
    };

    #draw() {
        const gl = this.#gl;
        const { width, height } = this.#canvas;

        gl.bindFramebuffer(gl.FRAMEBUFFER, this.#framebuffer);
        gl.viewport(0, 0, width, height);
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);

        this.#use(this.#sprite);

        for (const layer of this.#layers) layer.draw(this);

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, width, height);

        const { uniforms } = this.#post;
        this.#use(this.#post);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.#scene);
        gl.uniform1i(uniforms.u_scene, 0);
        gl.uniform2f(uniforms.u_resolution, width, height);
        gl.uniform1f(uniforms.u_dpr, this.view.dpr);
        gl.uniform1f(uniforms.u_seed, (this.#seed = (this.#seed + 1) % 1024) * 17.13);
        gl.uniform1f(uniforms.u_blur, 0.9 * this.view.dpr);
        gl.uniform1f(uniforms.u_grain, 0.16);
        gl.uniform2f(uniforms.u_vignette, 0.45, 0.6);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    #use({ program }) {
        const gl = this.#gl;
        gl.useProgram(program);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.#quad);
        const location = gl.getAttribLocation(program, 'a_unit');
        gl.enableVertexAttribArray(location);
        gl.vertexAttribPointer(location, 2, gl.FLOAT, false, 0, 0);
    }

    #texture(source) {
        const gl = this.#gl;
        const isVideo = source instanceof HTMLVideoElement;
        let entry = this.#textures.get(source);

        if (!entry) {
            entry = { texture: createTexture(gl), uploaded: false };
            this.#textures.set(source, entry);
        }

        gl.bindTexture(gl.TEXTURE_2D, entry.texture);

        if (isVideo || !entry.uploaded) {
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
            entry.uploaded = true;
        }

        return entry.texture;
    }

    #clip(x, y) {
        const { scale, x: ox, y: oy, width, height } = this.view;

        return [((x * scale + ox) / width) * 2 - 1, 1 - ((y * scale + oy) / height) * 2];
    }

    #drawQuad(texture, rect, uv, tint) {
        const gl = this.#gl;
        const { uniforms } = this.#sprite;
        const [x0, y0] = this.#clip(rect.x, rect.y);
        const [x1, y1] = this.#clip(rect.x + rect.w, rect.y + rect.h);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.uniform1i(uniforms.u_texture, 0);
        gl.uniform4f(uniforms.u_rect, x0, y0, x1, y1);
        gl.uniform4f(uniforms.u_uv, uv[0], uv[1], uv[2], uv[3]);
        gl.uniform4f(uniforms.u_tint, tint[0], tint[1], tint[2], tint[3]);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    drawCover(source, { dx = 0, dy = 0, alpha = 1 } = {}) {
        const width = source.videoWidth || source.naturalWidth;
        const height = source.videoHeight || source.naturalHeight;

        if (!width || !height) return;

        const ratio = REF.width / REF.height;
        let sw = width;
        let sh = height;

        if (width / height > ratio) sw = height * ratio;
        else sh = width / ratio;

        const u0 = (width - sw) / 2 / width;
        const v0 = (height - sh) / 2 / height;

        this.#drawQuad(
            this.#texture(source),
            { x: dx, y: dy, w: REF.width, h: REF.height },
            [u0, v0, 1 - u0, 1 - v0],
            [1, 1, 1, alpha],
        );
    }

    fillRect(rect, color) {
        this.#drawQuad(this.#white, rect, [0, 0, 1, 1], color);
    }

    strokeRect(rect, color, thickness) {
        const { x, y, w, h } = rect;
        this.fillRect({ x, y, w, h: thickness }, color);
        this.fillRect({ x, y: y + h - thickness, w, h: thickness }, color);
        this.fillRect({ x, y, w: thickness, h }, color);
        this.fillRect({ x: x + w - thickness, y, w: thickness, h }, color);
    }
}
