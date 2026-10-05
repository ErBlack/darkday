import { Renderer } from '../engine/renderer.js';
import { Input } from '../engine/input.js';
import { loadImage } from '../engine/load-image.js';
import { loadVideo } from '../engine/load-video.js';
import { VideoLayer } from '../engine/layers/video-layer.js';
import { unlock } from '../engine/audio/unlock.js';
import { loadSound } from '../engine/audio/load-sound.js';
import { createState } from './state.js';
import { Inventory } from './inventory.js';
import { Stage } from './stage.js';
import { Status } from './status.js';
import { LaptopScreen } from './laptop-screen.js';
import { loadItems } from './items.js';
import { corridor } from './scenes/corridor.js';
import { room } from './scenes/room.js';
import { laptop } from './scenes/laptop.js';
import { playEnding } from './ending/play-ending.js';
import { rememberCode } from './ending/remember-code.js';
import { loadVault } from '../os/vault/load-vault.js';
import { Achievements } from './achievements/achievements.js';
import { bonusLines } from './ending/bonus-lines.js';

const VIDEO_RATE = 1.25;
const SCENES = { corridor, room, laptop };

const buildScene = async definition => {
    const [background, ...patchImages] = await Promise.all([
        loadImage(definition.background),
        ...(definition.patches ?? []).map(patch => loadImage(patch.src)),
    ]);

    return {
        background,
        patches: (definition.patches ?? []).map((patch, index) => ({ ...patch, image: patchImages[index] })),
        foreground: definition.foreground ?? [],
        items: definition.items ?? [],
        targets: definition.targets ?? [],
    };
};

export const createGame = ({ state = createState(), onEnd = null } = {}) => {
    const canvas = document.createElement('canvas');
    canvas.id = 'game';
    document.body.prepend(canvas);

    const ui = document.createElement('canvas');
    ui.id = 'game-ui';
    canvas.after(ui);

    const renderer = new Renderer(canvas, ui);
    const status = new Status(renderer);
    const achievements = new Achievements();

    let inventory = null;
    let stage = null;
    let context = null;
    let items = null;
    let transitioning = 0;

    const input = new Input(renderer, {
        hotspots: () => stage?.hotspots() ?? [],
        held: () => inventory?.held ?? null,
        miss: item => stage.miss(item),
        release: () => inventory.putBack(),
    });

    const screen = new LaptopScreen(renderer, state, input, achievements);

    const compose = (extra = []) => {
        renderer.setLayers([stage, ...extra], [stage.overlay], [inventory, status]);
    };

    canvas.addEventListener('pointermove', event => {
        if (!inventory) return;

        inventory.pointer = renderer.toRef(event.clientX, event.clientY);

        if (inventory.held) renderer.invalidate();
    });

    const show = (name, scene) => {
        state.scene = name;
        stage.scene = scene;
        screen.show(name === 'laptop');
    };

    const go = async (video, next) => {
        transitioning += 1;
        input.enabled = false;
        screen.show(false);

        try {
            const [element, scene] = await Promise.all([loadVideo(`assets/video/${video}.mp4`), buildScene(SCENES[next](context))]);

            const layer = new VideoLayer(element, {
                rate: VIDEO_RATE,
                onSwap: () => show(next, scene),
            });

            compose([layer]);
            await layer.promise;
            compose();
            input.enabled = true;
        } finally {
            transitioning -= 1;
        }
    };

    const playVideo = async (url, rate) => {
        transitioning += 1;
        screen.show(false);

        try {
            const layer = new VideoLayer(await loadVideo(url), { rate });

            compose([layer]);
            await layer.promise;
        } finally {
            transitioning -= 1;
        }
    };

    let ending = false;

    screen.onEnding = kind => {
        const vault = screen.vault('ending');

        if (!vault) return;

        const script = vault.data.ending;
        const variant = script.variants[kind];
        const lines = bonusLines(variant.lines, script.bonus, kind, achievements);

        ending = true;
        input.enabled = false;
        playEnding(script, { ...variant, lines }, {
            screen: screen.element,
            code: rememberCode(kind),
            media: name => (vault.has(name) ? vault.url(name) : name),
            showArticle: url => screen.showArticle(url),
            standBy: () => screen.collapse(),
            playVideo,
            onCode: () => achievements.unlock(kind === 'good' ? 'split-monad' : 'obey-khaos'),
            onFinish: () => onEnd?.(),
        });
    };

    const busy = () =>
        transitioning > 0 ||
        screen.busy ||
        screen.zooming ||
        state.flags.keyState === 'falling' ||
        (items !== null && Object.values(items).some(item => item.sprite.busy));

    const ready = (async () => {
        items = await loadItems({ state, renderer });
        inventory = new Inventory({ renderer, state, items, status });
        stage = new Stage({ state, inventory, items });
        context = { state, items, inventory, status, screen, open: item => stage.open(item), go };

        show(state.scene, await buildScene(SCENES[state.scene](context)));
        compose();
    })();

    Promise.all([
        loadImage('assets/room.jpg'),
        loadImage('assets/laptop.jpg'),
        loadVideo('assets/video/door-open.mp4'),
        loadVideo('assets/video/to-laptop.mp4'),
        loadVideo('assets/video/to-room.mp4'),
        loadSound('assets/sounds/key-drop.mp3'),
        loadSound('assets/sounds/door-unlock.mp3'),
        loadSound('assets/sounds/door-open.mp3'),
        loadSound('assets/sounds/floor-board.mp3'),
        loadSound('assets/sounds/door-locked.mp3'),
        loadSound('assets/sounds/floor-creak.mp3'),
        loadSound('assets/sounds/cabinet-open.mp3'),
        loadSound('assets/sounds/flash-insert.mp3'),
        loadSound('assets/sounds/usb-connect.mp3'),
        loadSound('assets/sounds/startup.mp3'),
        loadSound('assets/sounds/shutdown.mp3'),
        loadSound('assets/sounds/logon.mp3'),
        loadSound('assets/sounds/logoff.mp3'),
        loadSound('assets/sounds/minimize.mp3'),
        loadSound('assets/sounds/restore.mp3'),
        loadSound('assets/sounds/error.mp3'),
        loadSound('assets/sounds/achievement.mp3'),
        loadVault('ending'),
    ]).catch(() => {});

    return {
        ready,
        state,
        status,
        achievements,
        screen,
        busy,
        get ending() {
            return ending;
        },
        start: async () => {
            unlock().catch(() => {});
            await ready;
            renderer.setGrainAnimated(true);
            input.enabled = !screen.expanded;
        },
        destroy: () => {
            input.enabled = false;
            renderer.destroy();
            screen.destroy();
            canvas.remove();
            ui.remove();
        },
    };
};
