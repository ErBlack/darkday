import { createGame } from './game/index.js';
import { createState } from './game/state.js';
import { showCodeButton } from './code-button.js';
import { GameMenu } from './game/menu/game-menu.js';
import { saveState } from './game/save/save-state.js';
import { loadState } from './game/save/load-state.js';
import { readAutosave } from './game/save/read-autosave.js';
import { clearAutosave } from './game/save/clear-autosave.js';
import { writeAutosave } from './game/save/write-autosave.js';
import { autosaveState } from './game/save/autosave-state.js';
import { unlock } from './engine/audio/unlock.js';
import { sha256 } from './os/khaos/sha256.js';
import { decodeCode } from './game/ending/win-code.js';

const EGG_DATE = new Date('2026-10-10T08:00:00.000Z');
const DEBUG_HASH = 'c1cd3a1c4e3e37e1410f9f5ebde39dc456f161450316523453f0f8e9f149173c';
const HOLD_MS = 2000;
const HOLD_TOLERANCE = 500;
const EDGE_RATIO = 0.1;

const params = () => new URLSearchParams(location.search);
const isDebug = async () => {
    const value = params().get('debug');

    return value !== null && (await sha256(value)) === DEBUG_HASH;
};
const isEggActive = async () => Date.now() >= EGG_DATE || (await isDebug());

const init = async () => {
    if (!(await isEggActive())) return;

    const invitation = document.getElementById('invitation');

    document.body.classList.add('egg');

    let game = null;
    let resetDrag = null;

    const showInvitation = () => {
        invitation.classList.remove('flying', 'armed', 'dragging');
        invitation.style.removeProperty('--x');
        invitation.style.removeProperty('--y');
        resetDrag?.();
        document.body.classList.remove('game');
        showCodeButton();
    };

    const inGame = () => document.body.classList.contains('game');

    const exit = () => {
        game.destroy();
        clearAutosave();
        newGame(createState());
        showInvitation();
    };

    const newGame = state => {
        const next = createGame({
            state: autosaveState(state, () => inGame() && game === next && !next.ending, () => next.busy()),
            onEnd: exit,
        });

        game = next;
        window.game = game;
    };

    const restart = state => {
        game.destroy();
        writeAutosave(state);
        newGame(state);
        game.start();
    };

    const startGame = () => {
        document.body.classList.add('game');
        game.start();
    };

    const saved = readAutosave();
    const resume = saved !== null && JSON.stringify(saved) !== JSON.stringify(createState());

    showCodeButton();
    newGame(saved ?? createState());

    if (resume) {
        startGame();
        addEventListener('pointerdown', () => unlock().catch(() => {}), { once: true });
    }

    new GameMenu({
        available: () => inGame() && !game.busy() && !game.screen.expanded && !game.screen.zooming && !document.querySelector('.ending, .dead-end'),
        unlocked: () => game.achievements.unlocked,
        canLoad: () => loadState() !== null,
        onSave: () => saveState(game.state),
        onLoad: () => {
            const state = loadState();

            if (state) restart(state);
        },
        onNew: () => {
            clearAutosave();
            restart(createState());
        },
        onExit: exit,
    });

    let hold = null;
    let drag = null;
    let moved = false;
    const offset = { x: 0, y: 0 };

    resetDrag = () => {
        hold = null;
        drag = null;
        moved = false;
        offset.x = 0;
        offset.y = 0;
    };

    const setPosition = (x, y) => {
        invitation.style.setProperty('--x', `${x}px`);
        invitation.style.setProperty('--y', `${y}px`);
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
        hold = null;
        invitation.classList.add('armed');
        navigator.vibrate?.(30);
        startDrag(event);
    };

    const flyAway = dx => {
        invitation.classList.add('flying');
        setPosition(offset.x + dx * innerWidth, offset.y);

        const onEnd = event => {
            if (event.target !== invitation || event.propertyName !== 'transform') return;

            invitation.removeEventListener('transitionend', onEnd);
            startGame();
        };

        invitation.addEventListener('transitionend', onEnd);
    };

    const onPointerDown = event => {
        if (!event.isPrimary) return;

        cancelHold();

        hold = {
            pointerId: event.pointerId,
            x: event.clientX,
            y: event.clientY,
            last: event,
            timer: setTimeout(() => arm(hold.last), HOLD_MS),
        };
    };

    const onPointerMove = event => {
        if (hold) {
            if (event.pointerId !== hold.pointerId) return;

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
        if (event.pointerId === hold?.pointerId) cancelHold();

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
    addEventListener('pointermove', onPointerMove);
    addEventListener('pointerup', onPointerUp);
    addEventListener('pointercancel', onPointerUp);
    invitation.addEventListener('click', onClick, true);
    invitation.addEventListener('contextmenu', event => event.preventDefault());
};

window.decode = decodeCode;

init();
