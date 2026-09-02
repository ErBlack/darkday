import { achievements } from '../achievements/list.js';

const ENDINGS = { good: 'split-monad', bad: 'obey-khaos' };

export const bonusLines = (lines, bonus, kind, unlocked) => {
    if (!bonus) return lines;

    const current = ENDINGS[kind];
    const other = Object.values(ENDINGS).find(id => id !== current);
    const has = id => id === current || unlocked.has(id);
    const extra = [
        ...(has(other) ? bonus.both : []),
        ...(achievements.every(entry => has(entry.id)) ? bonus.all : []),
    ];
    const at = lines.indexOf(bonus.after) + 1;

    return [...lines.slice(0, at), ...extra, ...lines.slice(at)];
};
