import './dead-end.css';
import { element } from '../dom/element.js';

const DARKEN_MS = 1500;
const TEXT_DELAY_MS = 1000;
const LINES = [
    'With these files deleted, the thread of prophecy is severed.',
    'Restore a saved game to restore the weave of fate, or persist in the doomed world you have created.',
];

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const clicked = node => new Promise(resolve => node.addEventListener('click', resolve, { once: true }));

export const playDeadEnd = async onRestore => {
    const curtain = element('div', 'dead-end', document.body);
    const text = element('div', 'dead-end-text', curtain);

    curtain.getBoundingClientRect();
    curtain.classList.add('dead-end-dark');
    await wait(DARKEN_MS + TEXT_DELAY_MS);

    for (const line of LINES) element('p', '', text).textContent = line;

    text.classList.add('dead-end-text-shown');
    curtain.classList.add('dead-end-ready');
    await clicked(curtain);
    onRestore();
    curtain.classList.remove('dead-end-dark', 'dead-end-ready');
    await wait(DARKEN_MS);
    curtain.remove();
};
