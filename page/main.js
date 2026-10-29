import { createState } from './game/state.js';
import { showCodeButton } from './code-button.js';
import { readAutosave } from './game/save/read-autosave.js';
import { unlock } from './engine/audio/unlock.js';
import { detectRaster } from './engine/raster.js';

const saved = readAutosave();
const resume = saved !== null && JSON.stringify(saved) !== JSON.stringify(createState());
const button = document.getElementById('start');

let session = null;

const loadSession = () =>
    (session ??= detectRaster()
        .then(() => import('./game/session.js'))
        .then(({ createSession }) => createSession({ saved, onExit: showCodeButton })));

const whenIdle = callback => (window.requestIdleCallback ?? setTimeout)(callback);

showCodeButton();

button.addEventListener('click', async () => {
    unlock().catch(() => {});
    button.setAttribute('aria-busy', 'true');

    try {
        await (await loadSession()).start();
    } finally {
        button.removeAttribute('aria-busy');
    }
});

if (resume) {
    loadSession().then(game => game.start());
    addEventListener('pointerdown', () => unlock().catch(() => {}), { once: true });
} else if (document.readyState === 'complete') {
    whenIdle(loadSession);
} else {
    addEventListener('load', () => whenIdle(loadSession), { once: true });
}
