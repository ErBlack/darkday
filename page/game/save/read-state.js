import { createState } from '../state.js';

const isPlain = value => value !== null && typeof value === 'object' && !Array.isArray(value);

const merge = (defaults, saved) => {
    if (!isPlain(defaults) || !isPlain(saved)) return saved === undefined ? defaults : saved;

    const result = { ...saved };

    for (const [key, value] of Object.entries(defaults)) result[key] = merge(value, saved[key]);

    return result;
};

export const readState = key => {
    try {
        const raw = localStorage.getItem(key);

        if (!raw) return null;

        const saved = JSON.parse(raw);

        return isPlain(saved) ? merge(createState(), saved) : null;
    } catch {
        return null;
    }
};
