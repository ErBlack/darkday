const EGG_DATE = new Date('2026-10-10T08:00:00.000Z');
const HOLD_MS = 2000;
const HOLD_TOLERANCE = 10;
const EDGE_RATIO = 0.1;

const isEggActive = () => Date.now() >= EGG_DATE || location.search === '?debug=1';

const startGame = () => {
    document.body.classList.add('game');
    document.dispatchEvent(new CustomEvent('darkday:start'));
};

const init = () => {
    if (!isEggActive()) return;

    const invitation = document.getElementById('invitation');

    document.body.classList.add('egg');

    let hold = null;
    let drag = null;
    let moved = false;
    const offset = { x: 0, y: 0 };

    const setPosition = (x, y, scale = 1) => {
        invitation.style.setProperty('--x', `${x}px`);
        invitation.style.setProperty('--y', `${y}px`);
        invitation.style.setProperty('--s', scale);
    };

    const offScreenDirection = () => {
        const { left, right } = invitation.getBoundingClientRect();

        if (left >= innerWidth * (1 - EDGE_RATIO)) return 1;
        if (right <= innerWidth * EDGE_RATIO) return -1;

        return 0;
    };

    const cancelHold = () => {
        if (!hold) return;

        clearTimeout(hold.timer);
        hold = null;
    };

    const startDrag = event => {
        drag = { pointerId: event.pointerId, x: event.clientX - offset.x, y: event.clientY - offset.y };
        moved = false;
        invitation.classList.add('dragging');
        invitation.setPointerCapture(event.pointerId);
    };

    const arm = event => {
        invitation.classList.add('armed');
        navigator.vibrate?.(30);
        startDrag(event);
    };

    const flyAway = dx => {
        invitation.classList.add('flying');
        setPosition(offset.x + dx * innerWidth, offset.y, 0.2);
        invitation.addEventListener('transitionend', startGame, { once: true });
    };

    const onPointerDown = event => {
        if (!event.isPrimary) return;

        cancelHold();

        hold = {
            x: event.clientX,
            y: event.clientY,
            last: event,
            timer: setTimeout(() => arm(hold.last), HOLD_MS),
        };
    };

    const onPointerMove = event => {
        if (hold) {
            hold.last = event;

            if (Math.hypot(event.clientX - hold.x, event.clientY - hold.y) > HOLD_TOLERANCE) cancelHold();

            return;
        }

        if (!drag || event.pointerId !== drag.pointerId) return;

        offset.x = event.clientX - drag.x;
        offset.y = event.clientY - drag.y;
        moved = true;
        setPosition(offset.x, offset.y);
    };

    const onPointerUp = event => {
        cancelHold();

        if (!drag || event.pointerId !== drag.pointerId) return;

        drag = null;
        invitation.classList.remove('dragging');

        const dx = event.type === 'pointerup' ? offScreenDirection() : 0;

        if (dx) {
            flyAway(dx);
            return;
        }

        invitation.classList.remove('armed');
        offset.x = 0;
        offset.y = 0;
        setPosition(0, 0);
    };

    const onClick = event => {
        if (moved) event.preventDefault();
    };

    invitation.addEventListener('pointerdown', onPointerDown);
    invitation.addEventListener('pointermove', onPointerMove);
    invitation.addEventListener('pointerup', onPointerUp);
    invitation.addEventListener('pointercancel', onPointerUp);
    invitation.addEventListener('click', onClick, true);
    invitation.addEventListener('contextmenu', event => event.preventDefault());
};

init();
