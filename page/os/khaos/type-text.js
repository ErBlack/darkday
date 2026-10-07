import { element } from '../dom/element.js';
import { typedText } from './typed-text.js';

export const typeText = (node, text, ms, keep = false) => new Promise(resolve => {
    const letters = [...text];
    let word = null;
    const chars = letters.map(char => {
        if (/\s/.test(char)) word = null;
        else if (!word) {
            word = element('span', '', node);
            word.style.whiteSpace = 'nowrap';
        }

        const span = element('span', '', word ?? node);
        span.textContent = char;
        span.style.visibility = 'hidden';

        return span;
    });
    const start = performance.now();

    const frame = now => {
        const shown = [...typedText(text, now - start)];

        chars.forEach((span, index) => {
            span.textContent = /\s/.test(letters[index]) ? letters[index] : shown[index] ?? letters[index];
            span.style.visibility = index < shown.length ? 'visible' : 'hidden';
        });

        if (keep && shown.join('') === text) return resolve();
        if (keep || now - start < ms) return requestAnimationFrame(frame);

        node.replaceChildren();
        resolve();
    };

    requestAnimationFrame(frame);
});
