import './ending.css';
import { element } from '../../os/dom/element.js';
import { playSound } from '../../engine/audio/play-sound.js';
import { typeText as type } from '../../os/khaos/type-text.js';
import { loadVideo } from '../../engine/load-video.js';
import { loadSound } from '../../engine/audio/load-sound.js';

const wait = ms => new Promise(resolve => setTimeout(resolve, Math.max(0, ms)));

const fade = (node, to, ms) => {
    getComputedStyle(node).opacity;
    node.style.transition = `opacity ${ms}ms ease-in-out`;
    node.style.opacity = to;

    return wait(ms);
};

const clicked = node => new Promise(resolve => node.addEventListener('click', resolve, { once: true }));

export const playEnding = async (script, variant, { screen, code, saved, max, media, showArticle, standBy, playVideo, onCode, onFinish }) => {
    const curtain = element('div', 'ending', document.body);
    const text = element('div', 'ending-text', curtain);
    const veil = element('div', 'ending ending-screen', screen);
    const title = element('div', 'ending-text', veil);
    const music = script.music;
    const clip = variant.video ? loadVideo(media(variant.video)).catch(() => null) : Promise.resolve(null);

    for (const sound of variant.videoSounds ?? []) loadSound(media(sound.src)).catch(() => {});

    await fade(veil, 1, script.darkenMs);

    const start = performance.now();
    const at = ms => wait(start + ms - performance.now());

    await at(music.at);

    const musicAt = performance.now() - start;

    playSound(media(music.src), { volume: music.volume, fadeTo: music.fadeTo, fadeMs: music.fadeMs }).catch(() => {});
    await at(script.title.at);
    showArticle(variant.article);
    await type(title, script.title.text, script.title.until - script.title.at);
    await at(script.revealAt);
    await fade(veil, 0, script.fadeMs);
    veil.remove();

    await at(script.standByAt);
    await standBy();
    await at(script.videoAt);

    const blackoutAt = musicAt + script.blackoutAfterMusic;

    const video = await clip;
    const rate = variant.videoRate ?? 1;
    let fadeAt = start + blackoutAt - script.fadeMs;

    if (video) {
        fadeAt = performance.now() + video.duration * 1000 / rate - script.fadeMs - script.videoFadeLeadMs;
        playVideo(media(variant.video), rate).catch(() => {});

        for (const sound of variant.videoSounds ?? []) playSound(media(sound.src), { delay: sound.at / rate, volume: sound.volume ?? 1 }).catch(() => {});
    }

    await wait(fadeAt - performance.now());
    await fade(curtain, 1, script.fadeMs);

    await wait(script.linesAt);

    for (const [index, line] of variant.lines.entries()) {
        if (index > 0) await wait(script.lineGapMs);

        await type(text, line.text ?? line, line.ms ?? script.lineMs);
    }

    const intro = saved ? [script.code.again] : max ? script.code.max : [script.code.intro];

    for (const line of intro) {
        await wait(script.lineGapMs);
        await type(text, line, script.lineMs);
    }

    await wait(script.lineGapMs);
    await type(text, code, 0, true);
    onCode();
    curtain.style.cursor = 'pointer';
    await clicked(curtain);
    curtain.style.cursor = '';
    navigator.clipboard.writeText(code).catch(() => {});
    text.replaceChildren();
    await type(text, script.code.copied, 0, true);
    await wait(script.code.holdMs);

    onFinish();
    await fade(curtain, 0, script.fadeMs);
    curtain.remove();
};
