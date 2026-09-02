import { audioContext } from '../../engine/audio/audio-context.js';
import { systemOutput } from './system-output.js';

export const connectMedia = media => {
    const context = audioContext();

    context.createMediaElementSource(media).connect(systemOutput().gain);
    media.addEventListener('play', () => context.resume());

    return media;
};
