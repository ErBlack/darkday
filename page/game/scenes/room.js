import { easeOut } from '../../engine/ease/ease-out.js';
import { playSound } from '../../engine/audio/play-sound.js';

const FLOOR_SOUND = 'assets/sounds/floor-board.mp3';

const CABINET = { x: 1090, y: 680, w: 248, h: 320 };
const CABINET_OPEN = { x: 1055, y: 645, w: 345, h: 410 };
const CABINET_SOUND = 'assets/sounds/cabinet-open.mp3';
const LAPTOP_ON_SHELF = { x: 1120, y: 705, w: 90, h: 35 };
const LAPTOP_HALFWAY = { x: 1125, y: 655, w: 115, h: 45, squash: 0.8, tint: [0.45, 0.47, 0.42] };
const LAPTOP_LIFTED = { x: 1110, y: 600, w: 140, h: 55, squash: 1, tint: [0.8, 0.8, 0.75] };
const TABLE = { x: 30, y: 950, w: 1085, h: 100 };
const LAPTOP_ON_TABLE = { x: 571, y: 701, w: 406, h: 284 };
const LAPTOP_SCREEN = { x: 570, y: 722, w: 365, h: 256 };
const CROWBAR_IN_BATH = { x: 1437, y: 948, w: 73, h: 17 };
const CROWBAR_VISIBLE = { x: 1470, y: 945, w: 50, h: 36 };
const CROWBAR_SLIDE = 110;
const BATH_WALL = { x: 1390, y: 580, w: 80, h: 440 };
const FLOOR_BOARD = { x: 1710, y: 1260, w: 102, h: 90 };
const FLOOR_OPEN = { x: 1675, y: 1240, w: 160, h: 130 };
const FLASH_IN_FLOOR = { x: 1722, y: 1300, w: 46, h: 16 };
const FLASH_HALFWAY = { x: 1716, y: 1270, w: 56, h: 19, rotation: 0.35, squash: 0.85 };
const FLASH_LIFTED = { x: 1710, y: 1245, w: 64, h: 22, rotation: 0.2, squash: 1 };

export const room = ({ state, items: { laptop, crowbar, flash }, inventory, go }) => {
    const { flags } = state;

    if (laptop.place === 'room') {
        laptop.rect = LAPTOP_ON_SHELF;
        laptop.sprite.tint = [0.16, 0.19, 0.14];
        laptop.sprite.squash = 0.6;
    }

    if (crowbar.place === 'room') {
        crowbar.rect = CROWBAR_IN_BATH;
        crowbar.sprite.tint = [0.18, 0.24, 0.16];
        crowbar.sprite.rotation = 0;
        crowbar.sprite.squash = 1;
    }

    if (flash.place === 'room') {
        flash.rect = FLASH_IN_FLOOR;
        flash.sprite.tint = [0.5, 0.5, 0.45];
        flash.sprite.rotation = 0.49;
        flash.sprite.squash = 0.7;
    }

    const openCabinet = () => {
        flags.cabinetOpen = true;
        playSound(CABINET_SOUND, { volume: 0.6 }).catch(() => {});
    };

    const closeCabinet = () => {
        flags.cabinetOpen = false;
        playSound(CABINET_SOUND, { volume: 0.6 }).catch(() => {});
    };

    const takeLaptop = async () => {
        await laptop.animate(LAPTOP_HALFWAY, { duration: 175, ease: easeOut });
        closeCabinet();
        await laptop.animate(LAPTOP_LIFTED, { duration: 175, ease: easeOut });

        await inventory.pickUp(laptop);
    };

    const takeCrowbar = async () => {
        await crowbar.animate({ x: CROWBAR_IN_BATH.x + CROWBAR_SLIDE }, { duration: 450, place: 'room' });
        flags.crowbarOut = true;
        await inventory.pickUp(crowbar);
    };

    const placeLaptop = item => {
        inventory.remove(item);
        flags.laptopPlaced = true;
    };

    const openLaptop = () => {
        if (flags.cabinetOpen) closeCabinet();

        return go('to-laptop', 'laptop');
    };

    const openFloor = item => {
        inventory.remove(item);
        flags.floorOpen = true;
        playSound(FLOOR_SOUND, { volume: 0.6 }).catch(() => {});
    };

    const creakFloor = () => {
        playSound('assets/sounds/floor-creak.mp3', { volume: 0.6 }).catch(() => {});
    };

    const closeFloor = () => {
        flags.floorOpen = false;
        playSound(FLOOR_SOUND, { volume: 0.6 }).catch(() => {});
    };

    const takeFlash = async () => {
        flags.flashTaken = true;

        await flash.animate(FLASH_HALFWAY, { duration: 175, ease: easeOut });
        closeFloor();
        await flash.animate(FLASH_LIFTED, { duration: 175, ease: easeOut });

        await inventory.pickUp(flash);
    };

    return {
        background: 'assets/room.jpg',
        patches: [
            { src: 'assets/patches/cabinet-open.png', rect: CABINET_OPEN, when: () => flags.cabinetOpen },
            { src: 'assets/patches/laptop-table.png', rect: LAPTOP_ON_TABLE, when: () => flags.laptopPlaced },
            { src: 'assets/patches/floor-open.png', rect: FLOOR_OPEN, when: () => flags.floorOpen },
        ],
        foreground: [{ rect: BATH_WALL, when: () => !flags.crowbarOut }],
        items: [
            { item: laptop, when: () => flags.cabinetOpen, quiet: true, click: takeLaptop },
            { item: crowbar, rect: CROWBAR_VISIBLE, when: () => !flags.crowbarOut, click: takeCrowbar },
        ],
        targets: [
            { rect: CABINET, when: () => !flags.cabinetOpen, click: openCabinet },
            { rect: TABLE, when: () => !flags.laptopPlaced, use: { laptop: placeLaptop } },
            { rect: FLOOR_BOARD, when: () => !flags.floorOpen, quiet: true, use: { crowbar: openFloor }, blocked: creakFloor },
            { rect: FLOOR_BOARD, when: () => flags.floorOpen && !flags.flashTaken, click: takeFlash },
            { rect: LAPTOP_SCREEN, when: () => flags.laptopPlaced, click: openLaptop },
        ],
    };
};
