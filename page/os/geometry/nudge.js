const STEP = 24;

export const nudge = (rect, area, taken) => {
    let { x, y } = rect;

    while (taken.some(other => other.x === x && other.y === y) && x + STEP + rect.w <= area.w && y + STEP + rect.h <= area.h) {
        x += STEP;
        y += STEP;
    }

    return { ...rect, x, y };
};
