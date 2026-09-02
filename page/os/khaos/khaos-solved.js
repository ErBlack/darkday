import { khaosAttack } from './khaos-attack.js';

export const khaosSolved = {
    sounds: khaosAttack.sounds,
    steps: [
        { ms: 250, flicker: 1, blocks: 0.8, tear: 0.7, rgb: 0.03, noise: 0.2, shake: 0.6 },
        { ms: 450, flicker: 0.1, rgb: 0.004 },
        { ms: 250, flicker: 1, blocks: 0.9, tear: 0.9, rgb: 0.04, noise: 0.3, shake: 0.8, invert: 0.5, swap: 1 },
        { ms: 800, swap: 1 },
    ],
};
