import { audioContext } from './audio-context.js';
import { loadSound } from './load-sound.js';

export const playSound = async (url, { volume = 1, delay = 0, output = null, fadeTo = null, fadeMs = 0, loop = false } = {}) => {
    const context = audioContext();
    const buffer = await loadSound(url);
    const source = context.createBufferSource();
    const gain = context.createGain();
    const start = context.currentTime + delay / 1000;

    source.buffer = buffer;
    source.loop = loop;
    gain.gain.setValueAtTime(volume, start);

    if (fadeTo !== null) gain.gain.linearRampToValueAtTime(fadeTo, start + fadeMs / 1000);

    source.connect(gain).connect(output ?? context.destination);
    source.start(start);

    return { source, gain };
};
