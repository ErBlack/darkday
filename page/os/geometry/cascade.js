const ORIGIN = 24;
const STEP = 24;

const isTaken = (taken, x, y) => taken.some(rect => rect.x === x && rect.y === y);

const fit = (length, room) => (length + ORIGIN * 2 > room ? Math.max(0, room - ORIGIN * 2) : length);

export const cascade = (wanted, area, taken) => {
    const size = { w: fit(wanted.w, area.w), h: fit(wanted.h, area.h) };
    const columns = Math.max(1, Math.floor((area.w - size.w - ORIGIN) / STEP));
    const rows = Math.max(1, Math.floor((area.h - size.h - ORIGIN) / STEP));
    const slots = Math.min(columns, rows);

    for (let index = 0; index <= taken.length; index++) {
        const offset = ORIGIN + (index % slots) * STEP;

        if (!isTaken(taken, offset, offset)) return { x: offset, y: offset, w: size.w, h: size.h };
    }

    return { x: ORIGIN, y: ORIGIN, w: size.w, h: size.h };
};
