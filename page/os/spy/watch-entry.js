const DWELL_MS = 3000;

export const watchEntry = (win, onLeave) => {
    let kind = null;
    let since = null;

    const start = () => {
        if (kind && win.active) since ??= performance.now();
    };

    const stop = () => {
        if (since === null) return;

        const long = performance.now() - since >= DWELL_MS;

        since = null;

        if (long) onLeave(kind);
    };

    win.onFocus = start;
    win.onBlur = stop;

    return {
        show(next) {
            if (next !== kind) {
                stop();
                kind = next;
            }

            start();
        },
        stop,
    };
};
