import './dialog.css';
import { element } from '../dom/element.js';
import { icon } from '../dom/icon.js';
import { push } from '../dom/push.js';
import { playSystemSound } from '../audio/play-system-sound.js';

const SOUNDS = { error: 'assets/sounds/error.mp3' };

export const dialog = (text, { title, icon: kind, buttons }) => ({
    title,
    dialog: true,
    mount(content, window) {
        content.classList.add('dialog');

        if (SOUNDS[kind]) playSystemSound(SOUNDS[kind], { volume: 0.6 }).catch(() => {});

        const body = element('div', 'dialog-body', content);
        icon(`assets/os/icons/${kind}.png`, 'dialog-icon', body);
        element('div', 'dialog-text', body).textContent = text;

        const row = element('div', 'dialog-buttons', content);

        for (const { label, action } of buttons) {
            push(label, row).addEventListener('click', () => {
                window.close();
                action?.();
            });
        }

        row.firstChild.focus();
    },
});
