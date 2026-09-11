import { Renderer } from '../engine/renderer.js';
import { Input } from '../engine/input.js';
import { loadImage } from '../engine/load-image.js';
import { loadVideo } from '../engine/load-video.js';
import { Background, VideoLayer, Debug } from '../engine/layers.js';
import { unlock } from '../engine/audio.js';

const VIDEO_RATE = 1.25;
const VIDEO_OFFSET = { 'door-open': { from: { dx: 0, dy: -4 }, to: { dx: 0, dy: -8 } } };

const DOOR = { x: 1247, y: 320, w: 450, h: 1080 };

export const createGame = ({ debug = false } = {}) => {
    const canvas = document.createElement('canvas');
    canvas.id = 'game';
    document.body.prepend(canvas);

    const renderer = new Renderer(canvas);
    const input = new Input(renderer);

    const state = { scene: 'corridor' };
    let current = { background: null, hotspots: [] };
    const debugLayer = debug ? new Debug(() => input.hotspots) : null;

    const compose = (extra = []) => {
        renderer.setLayers([current.background, ...extra, debugLayer].filter(Boolean));
    };

    const scenes = {
        corridor: async () => ({
            background: new Background(await loadImage('/assets/corridor.jpg')),
            hotspots: [{ rect: DOOR, action: () => transition('door-open', 'room') }],
        }),

        room: async () => ({
            background: new Background(await loadImage('/assets/room.jpg')),
            hotspots: [],
        }),

        laptop: async () => ({
            background: new Background(await loadImage('/assets/laptop.jpg')),
            hotspots: [],
        }),
    };

    const apply = (scene, built) => {
        state.scene = scene;
        current = built;
        input.setHotspots(built.hotspots);
    };

    const show = async scene => {
        apply(scene, await scenes[scene]());
        compose();
    };

    const transition = async (video, next) => {
        input.enabled = false;
        input.setHotspots([]);

        const [element, built] = await Promise.all([loadVideo(`/assets/video/${video}.mp4`), scenes[next]()]);

        const layer = new VideoLayer(element, {
            rate: VIDEO_RATE,
            offset: VIDEO_OFFSET[video],
            onSwap: () => {
                apply(next, built);
                compose([layer]);
            },
        });

        compose([layer]);
        await layer.promise;
        compose();
        input.enabled = true;
    };

    Promise.all([
        loadImage('/assets/room.jpg'),
        loadVideo('/assets/video/door-open.mp4'),
        loadVideo('/assets/video/to-laptop.mp4'),
    ]).catch(() => {});

    const ready = show('corridor');

    return {
        ready,
        state,
        start: async () => {
            unlock().catch(() => {});
            await ready;
            renderer.setGrainAnimated(true);
            input.enabled = true;
        },
    };
};
