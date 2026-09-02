const HOLD_MS = 550;
const TOLERANCE = 10;

const claimed = new WeakSet();

const swallowClick = target => {
    const swallow = event => {
        event.preventDefault();
        event.stopPropagation();
    };

    target.addEventListener('click', swallow, { capture: true, once: true });
    setTimeout(() => target.removeEventListener('click', swallow, true), HOLD_MS);
};

export const onContext = (target, handler) => {
    let hold = null;

    const cancel = () => {
        clearTimeout(hold?.timer);
        hold = null;
    };

    target.addEventListener('contextmenu', event => {
        event.preventDefault();
        event.stopPropagation();

        if (event.pointerType === 'touch' || event.sourceCapabilities?.firesTouchEvents) return;

        cancel();
        handler(event);
    });

    target.addEventListener('pointerdown', event => {
        if (event.pointerType !== 'touch' || claimed.has(event)) return;

        claimed.add(event);
        cancel();
        hold = {
            x: event.clientX,
            y: event.clientY,
            timer: setTimeout(() => {
                hold = null;
                swallowClick(target);
                handler(event);
            }, HOLD_MS),
        };
    });

    target.addEventListener('pointermove', event => {
        if (hold && Math.hypot(event.clientX - hold.x, event.clientY - hold.y) > TOLERANCE) cancel();
    });
    target.addEventListener('pointerup', cancel);
    target.addEventListener('pointercancel', cancel);
};
