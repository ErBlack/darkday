import { createGame } from './index.js';
import { createState } from './state.js';
import { GameMenu } from './menu/game-menu.js';
import { saveState } from './save/save-state.js';
import { loadState } from './save/load-state.js';
import { clearAutosave } from './save/clear-autosave.js';
import { writeAutosave } from './save/write-autosave.js';
import { autosaveState } from './save/autosave-state.js';
import { decodeCode } from './ending/win-code.js';

export const createSession = ({ saved, onExit }) => {
    let game = null;

    const inGame = () => document.body.classList.contains('game');

    const exit = () => {
        game.destroy();
        clearAutosave();
        newGame(createState());
        document.body.classList.remove('game');
        onExit();
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

    const start = () => {
        document.body.classList.add('game');
        return game.start();
    };

    newGame(saved ?? createState());

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

    window.decode = decodeCode;

    return { start };
};
