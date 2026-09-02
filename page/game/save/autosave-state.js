import { observe } from './observe.js';
import { writeAutosave } from './write-autosave.js';

export const autosaveState = (state, isActive) => {
    let pending = false;

    const flush = () => {
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
