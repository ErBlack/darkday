import { BEER, winCode } from './win-code.js';

const KEY = 'darkdayCode';

const freshCode = (ending, max) => (max ? `${BEER}${winCode(ending)}${BEER}` : winCode(ending));

export const rememberCode = (ending, max) => {
    try {
        const saved = localStorage.getItem(KEY);

        if (saved && (!max || saved.startsWith(BEER))) return { code: saved, saved: true };

        const code = freshCode(ending, max);

        localStorage.setItem(KEY, code);

        return { code, saved: false };
    } catch {
        return { code: freshCode(ending, max), saved: false };
    }
};
