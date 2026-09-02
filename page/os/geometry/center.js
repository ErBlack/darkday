export const center = (rect, within) => ({
    ...rect,
    x: Math.round(within.x + (within.w - rect.w) / 2),
    y: Math.round(within.y + (within.h - rect.h) / 2),
});
