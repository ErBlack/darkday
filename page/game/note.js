import { loadImage } from '../engine/load-image.js';

const WIDTH = 1024;
const HEIGHT = 1062;
const PADDING = 110;
const FONT = "500 40px 'Playwrite GB S'";
const LINE_HEIGHT = 64;
const COLOR = '#322d6f';

const PARAGRAPHS = [
    'My previous tenant disappeared without paying a penny, so I’m afraid I’ve learned my lesson.',
    'Rent is to be paid in advance, and don’t forget the three-month security deposit.',
    'I’ll be coming by the day after tomorrow to collect the money.',
    'L.',
];

const wrap = (ctx, text, maxWidth) => {
    const lines = [];
    let line = '';

    for (const word of text.split(' ')) {
        const candidate = line ? `${line} ${word}` : word;

        if (ctx.measureText(candidate).width > maxWidth && line) {
            lines.push(line);
            line = word;
        } else {
            line = candidate;
        }
    }

    if (line) lines.push(line);

    return lines;
};

export const renderNote = async () => {
    const [paper] = await Promise.all([loadImage('assets/paper.webp'), document.fonts.load(FONT)]);

    const canvas = document.createElement('canvas');
    canvas.width = WIDTH;
    canvas.height = HEIGHT;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(paper, 0, 0, WIDTH, HEIGHT);
    ctx.font = FONT;
    ctx.fillStyle = COLOR;
    ctx.textBaseline = 'top';

    let y = PADDING;

    for (const paragraph of PARAGRAPHS) {
        for (const line of wrap(ctx, paragraph, WIDTH - PADDING * 2)) {
            ctx.fillText(line, PADDING, y);
            y += LINE_HEIGHT;
        }

        y += LINE_HEIGHT * 0.6;
    }

    return canvas;
};
