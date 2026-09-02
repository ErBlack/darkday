const FONT_RATIO = 0.027;
const WIDTH_RATIO = 0.8;
const BOTTOM_RATIO = 0.9;
const LINE_HEIGHT = 1.35;
const OUTLINE_RATIO = 0.12;

const wrap = (context, text, width) => {
    const lines = [];
    let line = '';

    for (const word of text.split(' ')) {
        const next = line ? `${line} ${word}` : word;

        if (line && context.measureText(next).width > width) {
            lines.push(line);
            line = word;
        } else {
            line = next;
        }
    }

    if (line) lines.push(line);

    return lines;
};

export const drawLine = (context, text, shown) => {
    const { width, height } = context.canvas;
    const size = Math.round(height * FONT_RATIO);

    context.clearRect(0, 0, width, height);

    if (!shown) return;

    context.font = `${size}px Menlo, Consolas, 'Lucida Console', monospace`;
    context.textAlign = 'left';
    context.textBaseline = 'alphabetic';
    context.lineJoin = 'round';
    context.lineWidth = size * OUTLINE_RATIO;
    context.strokeStyle = '#000000';
    context.fillStyle = '#ffffff';

    const lines = wrap(context, text, width * WIDTH_RATIO);
    const bottom = height * BOTTOM_RATIO;
    let offset = 0;

    lines.forEach((line, index) => {
        const part = shown.slice(offset, offset + line.length);
        const x = (width - context.measureText(line).width) / 2;
        const y = bottom - (lines.length - 1 - index) * size * LINE_HEIGHT;

        offset += line.length + 1;

        if (!part) return;

        context.strokeText(part, x, y);
        context.fillText(part, x, y);
    });
};
