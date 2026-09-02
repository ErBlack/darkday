import './bios-screen.css';
import { element } from '../../os/dom/element.js';
import { biosLines } from './bios-lines.js';

const COUNT_STEP = 16;
const COUNT_MS = 18;

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

export const runBios = async (parent, flags) => {
    const root = element('div', 'laptop-bios', parent);
    const logo = element('img', 'laptop-bios-logo', root);
    logo.src = 'assets/os/bios-logo.png';
    logo.alt = '';
    const text = element('div', 'laptop-bios-text', root);

    for (const line of biosLines) {
        if (line.when && !line.when(flags)) continue;

        const row = element('div', '', text);

        if (line.count) {
            for (let value = 0; value <= line.count; value += COUNT_STEP) {
                row.textContent = `${value}${line.text}`;
                await wait(COUNT_MS);
            }
        } else {
            row.textContent = line.text || ' ';
        }

        await wait(line.wait);
    }

    return root;
};
