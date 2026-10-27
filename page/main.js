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
import { decodeCode } from './game/ending/win-code.js';

const init = () => {
    let game = null;

    const showHome = () => {
        document.body.classList.remove('game');
        showCodeButton();
    };

    const inGame = () => document.body.classList.contains('game');

    const exit = () => {
        game.destroy();
        clearAutosave();
        newGame(createState());
        showHome();
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

    document.getElementById('start').addEventListener('click', startGame);

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
};

window.decode = decodeCode;

init();
