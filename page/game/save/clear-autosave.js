import { AUTOSAVE_KEY } from './autosave-key.js';

export const clearAutosave = () => {
    try {
        localStorage.removeItem(AUTOSAVE_KEY);
    } catch {}
};
