import { easeOut } from '../../engine/ease/ease-out.js';
import { playSound } from '../../engine/audio/play-sound.js';
import { playSystemSound } from '../../os/audio/play-system-sound.js';

const BODY = { x: 780, y: 1050, w: 1430, h: 450 };
const WALL_LEFT = { x: 0, y: 0, w: 952, h: 990 };
const WALL_RIGHT = { x: 2055, y: 0, w: 732, h: 990 };
const WALL_TOP = { x: 952, y: 0, w: 1105, h: 150 };
const BODY_EDGE = { x: 2100, y: 1185, slope: 0.43, shadowWidth: 10, shadowFloor: 0.8 };
const FLASH_OUTSIDE = { x: 2126, y: 1125, w: 170, h: 56 };
const FLASH_INSERTED = { x: 2026, y: 1125, w: 170, h: 56 };
const FLASH_TINT = [0.5, 0.72, 0.48];
const PLUG_SOUND = 'assets/sounds/flash-insert.mp3';
const FLY_MS = 600;
const PLUG_MS = 300;
const PLUG_DELAY_MS = 80;
const INBOUND_SOUND = 'assets/sounds/usb-connect.mp3';
const INBOUND_DELAY_MS = 700;
const SCREEN = { x: 1000, y: 212, w: 1012, h: 759 };
const POWER_KEY = { x: 1948, y: 1114, w: 56, h: 34 };
const LED = { x: 2022, y: 1429, w: 56, h: 56 };

export const laptop = ({ state, items: { flash }, inventory, screen, go }) => {
    const { flags } = state;
    const inserted = () => flash.place === 'laptop';
    const leave = () => go('to-room', 'room');

    if (flash.place === 'laptop') {
        flash.rect = FLASH_INSERTED;
        flash.sprite.tint = FLASH_TINT;
        flash.sprite.edge = BODY_EDGE;
    }

    const insertFlash = async item => {
        item.rect = inventory.heldRect(item);
        inventory.remove(item);
        item.place = 'laptop';

        await item.flyTo(FLASH_OUTSIDE, { tint: FLASH_TINT, duration: FLY_MS });

        item.sprite.edge = BODY_EDGE;
        playSound(PLUG_SOUND, { volume: 0.7, delay: PLUG_DELAY_MS }).catch(() => {});
        await item.animate(FLASH_INSERTED, { duration: PLUG_MS, ease: easeOut, place: 'laptop' });
        screen.devicesChanged();

        if (flags.laptopOn && !screen.busy) playSystemSound(INBOUND_SOUND, { volume: 0.6, delay: INBOUND_DELAY_MS }).catch(() => {});
    };

    return {
        background: 'assets/laptop.jpg',
        patches: [{ src: 'assets/patches/led.png', rect: LED, when: () => screen.led > 0, alpha: () => screen.led }],
        items: [{ item: flash, fixed: true, when: inserted }],
        targets: [
            { rect: BODY, when: () => !inserted(), use: { flash: insertFlash } },
            { rect: POWER_KEY, when: () => !flags.laptopOn, click: () => screen.powerOn() },
            { rect: SCREEN, when: () => flags.laptopOn && !screen.busy, click: () => screen.expand() },
            { rect: WALL_LEFT, click: leave },
            { rect: WALL_RIGHT, click: leave },
            { rect: WALL_TOP, click: leave },
        ],
    };
};
