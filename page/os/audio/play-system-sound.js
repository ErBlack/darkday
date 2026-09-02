import { playSound } from '../../engine/audio/play-sound.js';
import { systemOutput } from './system-output.js';

export const playSystemSound = (url, { volume = 1, delay = 0, fadeTo = null, fadeMs = 0 } = {}) =>
    playSound(url, { volume, delay, fadeTo, fadeMs, output: systemOutput().gain });
