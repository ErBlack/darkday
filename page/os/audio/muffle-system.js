import { audioContext } from '../../engine/audio/audio-context.js';
import { systemOutput } from './system-output.js';

const MUFFLED_GAIN = 0.7;
const MUFFLED_FREQUENCY = 2500;

export const muffleSystem = amount => {
    const { gain, filter } = systemOutput();
    const open = audioContext().sampleRate / 2;

    gain.gain.value = 1 + (MUFFLED_GAIN - 1) * amount;
    filter.frequency.value = open * (MUFFLED_FREQUENCY / open) ** amount;
};
