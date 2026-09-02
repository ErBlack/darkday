import { audioContext } from '../../engine/audio/audio-context.js';

let output = null;

export const systemOutput = () => {
    if (output) return output;

    const context = audioContext();
    const gain = context.createGain();
    const filter = context.createBiquadFilter();

    filter.type = 'lowpass';
    filter.frequency.value = context.sampleRate / 2;
    gain.connect(filter).connect(context.destination);
    output = { gain, filter };

    return output;
};
