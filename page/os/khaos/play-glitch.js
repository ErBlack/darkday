import VERTEX from '../../engine/shaders/post.vert.glsl?raw';
import FRAGMENT from './glitch.frag.glsl?raw';
import { createProgram } from '../../engine/gl/create-program.js';
import { createTexture } from '../../engine/gl/create-texture.js';
import { createUnitQuad } from '../../engine/gl/create-unit-quad.js';
import { loadVideo } from '../../engine/load-video.js';
import { audioContext } from '../../engine/audio/audio-context.js';
import { loadSound } from '../../engine/audio/load-sound.js';
import { element } from '../dom/element.js';
import { playSystemSound } from '../audio/play-system-sound.js';
import { typedText } from './typed-text.js';
import { drawLine } from './draw-line.js';
import { createGlitchSlots } from './glitch-slots.js';
import { drawReveal } from './draw-reveal.js';
import { loadImage } from '../../engine/load-image.js';

const PARAMS = ['flicker', 'blocks', 'tear', 'rgb', 'noise', 'scan', 'shake', 'invert', 'pixel', 'video', 'key', 'flash', 'swap'];

const lerp = (from, to, t) => from + (to - from) * t;

const timeline = steps => {
    let start = 0;
    let previous = {};

    return steps.map(step => {
        const segment = { start, end: start + step.ms, from: previous, to: step };

        start = segment.end;
        previous = step;

        return segment;
    });
};

const sample = (segments, elapsed) => {
    const segment = segments.find(({ end }) => elapsed < end) ?? segments.at(-1);
    const t = Math.min(1, (elapsed - segment.start) / (segment.end - segment.start));

    return Object.fromEntries(PARAMS.map(name => [name, lerp(segment.from[name] ?? 0, segment.to[name] ?? 0, t)]));
};

const lineAt = (lines, elapsed) => {
    const line = lines.findLast(({ at }) => elapsed >= at);

    if (line?.until !== undefined && elapsed >= line.until) return { text: '', shown: '' };

    return line ? { text: line.text, shown: typedText(line.text, elapsed - line.at) } : { text: '', shown: '' };
};

const upload = (gl, texture, unit, source) => {
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
};

const aspectRatio = (canvas, video) => (video.videoWidth / video.videoHeight) / (canvas.width / canvas.height);

const addressOf = location => {
    if (!location) return [];

    const coordinates = `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`;

    return [location.place, coordinates].filter(Boolean);
};

export const playGlitch = async (parent, image, next, { steps, video, voice, lines = [], sounds, reveal }, personal = {}) => {
    const canvas = element('canvas', 'khaos-glitch');
    canvas.width = image.width;
    canvas.height = image.height;

    const gl = canvas.getContext('webgl', { alpha: false, antialias: false });

    if (!gl) return;

    let playing = false;
    const { program, uniforms, unit } = createProgram(gl, VERTEX, FRAGMENT);
    const quad = createUnitQuad(gl);
    const imageTexture = createTexture(gl);
    const nextTexture = createTexture(gl);
    const frameTexture = createTexture(gl);
    const textTexture = createTexture(gl);
    const text = document.createElement('canvas').getContext('2d');
    let shown = null;
    const revealTexture = createTexture(gl);
    const revealLayer = document.createElement('canvas').getContext('2d');
    const address = addressOf(personal.location);
    const timing = reveal ?? { photoAt: Infinity, addressAt: Infinity, hideAt: Infinity, glitchMs: 0 };
    const slammed = new Set();
    let revealed = '';

    text.canvas.width = canvas.width;
    text.canvas.height = canvas.height;
    revealLayer.canvas.width = canvas.width;
    revealLayer.canvas.height = canvas.height;

    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    upload(gl, imageTexture, 0, image);
    upload(gl, frameTexture, 1, image);
    upload(gl, textTexture, 2, text.canvas);
    upload(gl, nextTexture, 3, image);
    upload(gl, revealTexture, 4, revealLayer.canvas);

    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.enableVertexAttribArray(unit);
    gl.vertexAttribPointer(unit, 2, gl.FLOAT, false, 0, 0);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform1i(uniforms.u_image, 0);
    gl.uniform1i(uniforms.u_frame, 1);
    gl.uniform1i(uniforms.u_text, 2);
    gl.uniform1i(uniforms.u_next, 3);
    gl.uniform1i(uniforms.u_reveal, 4);
    gl.uniform1f(uniforms.u_hasNext, 0);

    next.then(picture => {
        upload(gl, nextTexture, 3, picture);
        gl.uniform1f(uniforms.u_hasNext, 1);
    }).catch(() => {});
    gl.uniform1f(uniforms.u_hasFrame, 0);
    gl.uniform2f(uniforms.u_resolution, canvas.width, canvas.height);
    gl.uniform2f(uniforms.u_frameScale, 1, 1);
    gl.uniform1f(uniforms.u_time, 0);
    gl.uniform1f(uniforms.u_revealAlpha, 1);

    for (const name of PARAMS) gl.uniform1f(uniforms[`u_${name}`], 0);

    for (const name of ['flicker', 'tear', 'blocks']) {
        gl.uniform1f(uniforms[`u_${name}On`], 0);
        gl.uniform1f(uniforms[`u_${name}Seed`], 0);
        gl.uniform1f(uniforms[`u_${name}Amount`], 0);
    }

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    parent.append(canvas);

    const clip = video ? await loadVideo(video.src).catch(() => null) : null;
    const photo = personal.photo ? await loadImage(personal.photo).catch(() => null) : null;
    const moments = [photo && timing.photoAt, address.length && timing.addressAt, (photo || address.length) && timing.hideAt].filter(Number.isFinite);
    const ratio = clip ? aspectRatio(canvas, clip) : 1;

    gl.uniform2f(uniforms.u_frameScale, Math.min(1, 1 / ratio), Math.min(1, ratio));

    const segments = timeline(steps);
    const duration = segments.at(-1).end;

    const context = audioContext();
    let voiceStart = null;

    if (voice) {
        await context.resume().catch(() => {});
        await loadSound(voice.src).catch(() => {});
        voiceStart = context.currentTime + voice.at / 1000;
        playSystemSound(voice.src, { delay: voice.at, volume: voice.volume, fadeTo: voice.fadeTo, fadeMs: voice.fadeMs }).catch(() => {});
    }

    const glitch = await createGlitchSlots(sounds);

    await new Promise(resolve => {
        const start = performance.now();

        const frame = now => {
            const elapsed = now - start;
            const params = sample(segments, elapsed);

            const spoken = voiceStart === null ? elapsed : (context.currentTime - voiceStart) * 1000 + voice.at;
            const line = lineAt(lines, spoken);

            if (clip && !playing && elapsed >= video.at) {
                playing = true;
                clip.currentTime = 0;
                clip.play().catch(() => {});
                gl.uniform1f(uniforms.u_hasFrame, 1);
            }

            if (playing) upload(gl, frameTexture, 1, clip);

            if (line.shown !== shown) {
                shown = line.shown;
                drawLine(text, line.text, line.shown);
                upload(gl, textTexture, 2, text.canvas);
            }

            gl.uniform1f(uniforms.u_time, elapsed / 1000);

            for (const name of PARAMS) gl.uniform1f(uniforms[`u_${name}`], params[name]);

            const hidden = spoken >= timing.hideAt + timing.glitchMs;
            const showPhoto = Boolean(photo) && spoken >= timing.photoAt && !hidden;
            const showAddress = address.length > 0 && spoken >= timing.addressAt && !hidden;
            const key = `${showPhoto}${showAddress}`;
            const moment = moments.find(at => spoken >= at && spoken < at + timing.glitchMs);

            if (moment !== undefined && !slammed.has(moment)) {
                slammed.add(moment);
                glitch.slam(elapsed, timing.glitchMs);
            }

            if (key !== revealed) {
                revealed = key;
                drawReveal(revealLayer, { photo, address, showPhoto, showAddress });
                upload(gl, revealTexture, 4, revealLayer.canvas);
            }

            gl.uniform1f(uniforms.u_revealAlpha, moment === undefined || Math.random() < 0.5 ? 1 : 0);

            const slots = glitch.update(params, elapsed);

            for (const name of ['flicker', 'tear', 'blocks']) {
                gl.uniform1f(uniforms[`u_${name}On`], slots[name].on);
                gl.uniform1f(uniforms[`u_${name}Seed`], slots[name].seed);
                gl.uniform1f(uniforms[`u_${name}Amount`], slots[name].amount);
            }

            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

            if (elapsed < duration) return requestAnimationFrame(frame);

            resolve();
        };

        requestAnimationFrame(frame);
    });

    clip?.pause();
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    canvas.remove();
};
