const VISIBLE = 100;

export const clampToArea = (rect, area, min) => {
    const w = Math.max(min.w, Math.min(rect.w, area.w));
    const h = Math.max(min.h, Math.min(rect.h, area.h));
    const x = Math.max(VISIBLE - w, Math.min(rect.x, area.w - VISIBLE));
    const y = Math.max(0, Math.min(rect.y, area.h - VISIBLE));

    return { x, y, w, h };
};
