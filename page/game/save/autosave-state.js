import { observe } from './observe.js';
import { writeAutosave } from './write-autosave.js';

const RETRY_MS = 120;

export const autosaveState = (state, isActive, isBusy = () => false) => {
    let pending = false;

    const flush = () => {
        if (isBusy()) {
            setTimeout(flush, RETRY_MS);

            return;
        }

        pending = false;

        if (isActive()) writeAutosave(state);
    };

    const schedule = () => {
        if (pending) return;

        pending = true;
        queueMicrotask(flush);
    };

    return observe(state, schedule);
};
