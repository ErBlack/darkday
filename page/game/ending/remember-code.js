import { winCode } from './win-code.js';

const KEY = 'darkdayCode';

export const rememberCode = ending => {
    try {
        const saved = localStorage.getItem(KEY);

        if (saved) return saved;

        const code = winCode(ending);

        localStorage.setItem(KEY, code);

        return code;
    } catch {
        return winCode(ending);
    }
};
