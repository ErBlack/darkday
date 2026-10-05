import { createProgram } from './gl/create-program.js';
import { createTexture } from './gl/create-texture.js';
import { createUnitQuad } from './gl/create-unit-quad.js';
import { REF } from './ref.js';
import SPRITE_VERTEX from './shaders/sprite.vert.glsl?raw';
import SPRITE_FRAGMENT from './shaders/sprite.frag.glsl?raw';
import POST_VERTEX from './shaders/post.vert.glsl?raw';
import POST_FRAGMENT from './shaders/post.frag.glsl?raw';

const MAX_DPR = 2;
const FULL = { x: 0, y: 0, w: REF.width, h: REF.height };
const GRAIN_FPS = 24;
const POST = { blur: 0.9, grain: 0.16, vignetteStart: 0.45, vignetteStrength: 0.6 };

const sourceSize = source => ({
    width: source.videoWidth || source.naturalWidth || source.width,
    height: source.videoHeight || source.naturalHeight || source.height,
});

const createSurface = (canvas, options) => {
    const gl = canvas.getContext('webgl', { antialias: false, ...options });
    const white = createTexture(gl);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255, 255, 255, 255]));

    const target = createTexture(gl);
    const framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, target, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    gl.enable(gl.BLEND);
    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    return {
        canvas,
        gl,
        white,
        target,
        framebuffer,
        sprite: createProgram(gl, SPRITE_VERTEX, SPRITE_FRAGMENT),
        post: createProgram(gl, POST_VERTEX, POST_FRAGMENT),
        quad: createUnitQuad(gl),
        textures: new WeakMap(),
    };
};

export class Renderer {
    #canvas;
    #scene;
    #ui;
    #gl;
    #sprite;
    #quad;
    #white;
    #textures;
    #layers = [];
    #floating = [];
    #overlays = [];
    #frame = null;
    #last = 0;
    #seed = 0;
    #grainTimer = null;

    #base = null;

    view = { dpr: 1, scale: 1, x: 0, y: 0, width: 0, height: 0 };
    camera = FULL;

    constructor(canvas, uiCanvas) {
        this.#canvas = canvas;
        this.#scene = createSurface(canvas, { alpha: false, premultipliedAlpha: false });
        this.#ui = createSurface(uiCanvas, { alpha: true, premultipliedAlpha: true });
        this.#bind(this.#scene);

        addEventListener('resize', this.#onResize);
        this.resize();
    }

    #onResize = () => this.resize();

    #bind(surface) {
        this.#gl = surface.gl;
        this.#sprite = surface.sprite;
        this.#quad = surface.quad;
        this.#white = surface.white;
        this.#textures = surface.textures;
    }

    destroy() {
        removeEventListener('resize', this.#onResize);
        clearInterval(this.#grainTimer);
        cancelAnimationFrame(this.#frame);
        this.#frame = null;
        this.#layers = [];
        this.#floating = [];
        this.#overlays = [];

        for (const { gl } of [this.#scene, this.#ui]) gl.getExtension('WEBGL_lose_context')?.loseContext();
    }

    get canvas() {
        return this.#canvas;
    }

    resize() {
        const dpr = Math.min(devicePixelRatio || 1, MAX_DPR);
        const width = innerWidth;
        const height = innerHeight;

        for (const { canvas, gl, target } of [this.#scene, this.#ui]) {
            canvas.width = Math.round(width * dpr);
            canvas.height = Math.round(height * dpr);
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;
            gl.bindTexture(gl.TEXTURE_2D, target);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, canvas.width, canvas.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        }

        this.view = { ...this.view, dpr, width, height };
        this.#base = this.#fit(FULL);
        this.setCamera(this.camera);
    }

    setCamera(camera) {
        this.camera = camera;
        this.view = this.#fit(camera);
        this.invalidate();
    }

    #fit(camera) {
        const { width, height } = this.view;
        const scale = Math.max(width / camera.w, height / camera.h);

        return {
            ...this.view,
            scale,
            x: width / 2 - (camera.x + camera.w / 2) * scale,
            y: height / 2 - (camera.y + camera.h / 2) * scale,
        };
    }

    toRef(clientX, clientY) {
        return {
            x: (clientX - this.view.x) / this.view.scale,
            y: (clientY - this.view.y) / this.view.scale,
        };
    }

    toClient(rect) {
        const { scale, x, y } = this.view;

        return { x: rect.x * scale + x, y: rect.y * scale + y, w: rect.w * scale, h: rect.h * scale };
    }

    setLayers(layers, floating = [], overlays = []) {
        this.#layers = layers;
        this.#floating = floating;
        this.#overlays = overlays;
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

        for (const layer of [...this.#layers, ...this.#floating, ...this.#overlays]) {
            if (layer.update?.(dt)) alive = true;
        }

        this.#draw();

        if (alive && this.#frame === null) this.#frame = requestAnimationFrame(this.#tick);
    };

    #draw() {
        this.#seed = (this.#seed + 1) % 1024;
        this.#pass(this.#scene, this.#layers, [0, 0, 0, 1]);
        this.#pass(this.#ui, this.#floating, [0, 0, 0, 0]);
        this.#use(this.#sprite);

        const scene = this.view;
        this.view = this.#base;

        for (const layer of this.#overlays) layer.draw?.(this);

        this.view = scene;
        this.#bind(this.#scene);
    }

    #pass(surface, layers, clear) {
        this.#bind(surface);

        const gl = this.#gl;
        const { width, height } = surface.canvas;

        gl.bindFramebuffer(gl.FRAMEBUFFER, surface.framebuffer);
        gl.viewport(0, 0, width, height);
        gl.clearColor(...clear);
        gl.clear(gl.COLOR_BUFFER_BIT);

        this.#use(this.#sprite);

        for (const layer of layers) layer.draw?.(this);

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, width, height);
        gl.disable(gl.BLEND);

        const { uniforms } = surface.post;
        this.#use(surface.post);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, surface.target);
        gl.uniform1i(uniforms.u_scene, 0);
        gl.uniform2f(uniforms.u_resolution, width, height);
        gl.uniform1f(uniforms.u_cell, Math.max(1, Math.round(this.view.dpr)));
        gl.uniform2f(uniforms.u_seed, (this.#seed * 37) % 256, (this.#seed * 91) % 256);
        gl.uniform1f(uniforms.u_blur, POST.blur * this.view.dpr);
        gl.uniform1f(uniforms.u_grain, POST.grain);
        gl.uniform2f(uniforms.u_vignette, POST.vignetteStart, POST.vignetteStrength);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        gl.enable(gl.BLEND);
    }

    #use({ program, unit }) {
        const gl = this.#gl;
        gl.useProgram(program);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.#quad);
        gl.enableVertexAttribArray(unit);
        gl.vertexAttribPointer(unit, 2, gl.FLOAT, false, 0, 0);
    }

    #texture(source) {
        const gl = this.#gl;
        let entry = this.#textures.get(source);

        if (!entry) {
            entry = { texture: createTexture(gl), uploaded: false };
            this.#textures.set(source, entry);
        }

        gl.bindTexture(gl.TEXTURE_2D, entry.texture);

        if (source instanceof HTMLVideoElement || !entry.uploaded) {
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
            entry.uploaded = true;
        }

        return entry.texture;
    }

    #clip(x, y) {
        const { scale, x: ox, y: oy, width, height } = this.view;

        return [((x * scale + ox) / width) * 2 - 1, 1 - ((y * scale + oy) / height) * 2];
    }

    #drawQuad(texture, rect, uv, tint, { rotation = 0, squash = 1, edge = null } = {}) {
        const gl = this.#gl;
        const { uniforms } = this.#sprite;
        const cos = Math.cos(rotation);
        const sin = Math.sin(rotation);
        const height = rect.h * squash;
        const axisX = { x: rect.w * cos, y: rect.w * sin };
        const axisY = { x: -height * sin, y: height * cos };
        const originRef = {
            x: rect.x + rect.w / 2 - axisX.x / 2 - axisY.x / 2,
            y: rect.y + rect.h / 2 - axisX.y / 2 - axisY.y / 2,
        };
        const origin = this.#clip(originRef.x, originRef.y);
        const cornerX = this.#clip(originRef.x + axisX.x, originRef.y + axisX.y);
        const cornerY = this.#clip(originRef.x + axisY.x, originRef.y + axisY.y);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.uniform1i(uniforms.u_texture, 0);
        gl.uniform2f(uniforms.u_origin, origin[0], origin[1]);
        gl.uniform2f(uniforms.u_axis_x, cornerX[0] - origin[0], cornerX[1] - origin[1]);
        gl.uniform2f(uniforms.u_axis_y, cornerY[0] - origin[0], cornerY[1] - origin[1]);
        gl.uniform2f(uniforms.u_ref_origin, originRef.x, originRef.y);
        gl.uniform2f(uniforms.u_ref_axis_x, axisX.x, axisX.y);
        gl.uniform2f(uniforms.u_ref_axis_y, axisY.x, axisY.y);
        gl.uniform4f(uniforms.u_uv, uv[0], uv[1], uv[2], uv[3]);
        gl.uniform4f(uniforms.u_tint, tint[0], tint[1], tint[2], tint[3]);

        if (edge) {
            gl.uniform4f(uniforms.u_edge, edge.x, edge.y, edge.slope, 1);
            gl.uniform2f(uniforms.u_shade, edge.shadowWidth, edge.shadowFloor);
        } else {
            gl.uniform4f(uniforms.u_edge, 0, 0, 0, 0);
        }

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    drawImage(source, rect, { alpha = 1, tint = [1, 1, 1], ...transform } = {}) {
        this.#drawQuad(this.#texture(source), rect, [0, 0, 1, 1], [...tint, alpha], transform);
    }

    drawRegion(source, rect) {
        const { width, height } = sourceSize(source);
        const uv = [rect.x / width, rect.y / height, (rect.x + rect.w) / width, (rect.y + rect.h) / height];

        this.#drawQuad(this.#texture(source), rect, uv, [1, 1, 1, 1]);
    }

    drawCover(source, { alpha = 1 } = {}) {
        const { width, height } = sourceSize(source);

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
            { x: 0, y: 0, w: REF.width, h: REF.height },
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
