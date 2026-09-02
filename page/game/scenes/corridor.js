import { easeIn } from '../../engine/ease/ease-in.js';
import { easeOut } from '../../engine/ease/ease-out.js';
import { playSound } from '../../engine/audio/play-sound.js';

const DOOR = { x: 1247, y: 320, w: 450, h: 1080 };
const LOCK = { x: 1244, y: 814, w: 50, h: 130 };
const NOTE_ON_DOOR = { x: 1400, y: 640, w: 150, h: 156 };
const KEY_UNDER_NOTE = { x: 1435, y: 700, w: 80, h: 40 };
const KEY_ON_FLOOR = { x: 1420, y: 1428, w: 80, h: 40 };
const KEY_TINT = [0.5, 0.48, 0.4];
const KEY_REST = { rotation: 0, squash: 0.45 };

export const corridor = ({ state, items: { key, note }, inventory, status, open, go }) => {
    const { flags } = state;

    if (note.place === 'corridor') note.rect = NOTE_ON_DOOR;

    if (key.place === 'corridor') {
        key.sprite.tint = KEY_TINT;

        if (flags.keyState === 'floor') {
            key.rect = KEY_ON_FLOOR;
            key.sprite.rotation = KEY_REST.rotation;
            key.sprite.squash = KEY_REST.squash;
        } else {
            key.rect = KEY_UNDER_NOTE;
            key.sprite.rotation = 0.4;
            key.sprite.squash = 0.9;
        }
    }

    const dropKey = async () => {
        const floor = KEY_ON_FLOOR.y;
        const rest = Math.PI * 2 + KEY_REST.rotation;

        await key.animate({ x: 1400, y: floor - 12, rotation: rest - 1.0, squash: 0.7 }, { duration: 620, ease: easeIn });
        playSound('assets/sounds/key-drop.mp3', { volume: 0.4 }).catch(() => {});
        await key.animate({ x: 1410, y: floor - 70, rotation: rest - 0.4, squash: 0.55 }, { duration: 160, ease: easeOut });
        await key.animate({ ...KEY_ON_FLOOR, rotation: rest, squash: KEY_REST.squash }, { duration: 170, ease: easeIn });

        key.sprite.rotation = KEY_REST.rotation;
    };

    const readNote = async () => {
        const opening = open(note);

        if (flags.keyState === 'hidden') {
            flags.keyState = 'falling';
            await dropKey();
            flags.keyState = 'floor';
        }

        await opening;
    };

    const lockedDoor = () => {
        playSound('assets/sounds/door-locked.mp3', { volume: 0.6 }).catch(() => {});
        status.show('Locked');
    };

    const openDoor = () => {
        playSound('assets/sounds/door-open.mp3', { volume: 0.6 }).catch(() => {});
        go('door-open', 'room');
    };

    const unlockDoor = item => {
        inventory.remove(item);
        flags.doorUnlocked = true;
        playSound('assets/sounds/door-unlock.mp3', { volume: 0.6 }).catch(() => {});
        status.show('Unlocked');
    };

    return {
        background: 'assets/corridor.jpg',
        items: [
            { item: key, when: () => flags.keyState === 'floor' },
            { item: note, click: readNote },
        ],
        targets: [
            { rect: LOCK, when: () => !flags.doorUnlocked, use: { key: unlockDoor } },
            { rect: DOOR, when: () => !flags.doorUnlocked, blocked: lockedDoor },
            { rect: DOOR, when: () => flags.doorUnlocked, click: openDoor },
        ],
    };
};
