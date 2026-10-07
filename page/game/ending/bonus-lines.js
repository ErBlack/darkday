import { achievements } from '../achievements/list.js';

const ENDINGS = { good: 'split-monad', bad: 'obey-khaos' };

const owns = (kind, unlocked) => id => id === ENDINGS[kind] || unlocked.has(id);

export const completed = (kind, unlocked) => achievements.every(entry => owns(kind, unlocked)(entry.id));

export const bonusLines = (lines, bonus, kind, unlocked) => {
    if (!bonus) return lines;

    const other = Object.values(ENDINGS).find(id => id !== ENDINGS[kind]);
    const extra = [
        ...(owns(kind, unlocked)(other) ? bonus.both : []),
        ...(completed(kind, unlocked) ? bonus.all : []),
    ];
    const at = lines.indexOf(bonus.after) + 1;

    return [...lines.slice(0, at), ...extra, ...lines.slice(at)];
};
