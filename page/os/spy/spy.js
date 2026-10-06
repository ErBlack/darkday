import { takePhoto } from '../camera/take-photo.js';
import { locate } from '../location/locate.js';

const ACTIONS = { camera: takePhoto, location: locate };
const DELAY_MS = 10000;
const timers = new Set();

export const spy = (kind, { state, achievements }) => {
    if (state.spied[kind]) return;

    state.spied[kind] = true;

    const timer = setTimeout(() => {
        timers.delete(timer);
        ACTIONS[kind](achievements).catch(() => {});
    }, DELAY_MS);

    timers.add(timer);
};

export const cancelSpies = () => {
    for (const timer of timers) clearTimeout(timer);

    timers.clear();
};
