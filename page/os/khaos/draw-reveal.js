const MARGIN = 0.04;
const PHOTO_HEIGHT = 0.36;
const PHOTO_MAX_WIDTH = 0.3;
const PHOTO_TOP = 0.16;
const ADDRESS_Y = 0.62;
const FONT_RATIO = 0.034;
const LINE_HEIGHT = 1.3;
const OUTLINE_RATIO = 0.12;

export const drawReveal = (context, { photo, address, showPhoto, showAddress }) => {
    const { width, height } = context.canvas;
    const x = width * MARGIN;

    context.clearRect(0, 0, width, height);

    if (showPhoto && photo) {
        const scale = Math.min(height * PHOTO_HEIGHT / photo.height, width * PHOTO_MAX_WIDTH / photo.width);
        const w = photo.width * scale;
        const h = photo.height * scale;

        context.save();
        context.filter = 'grayscale(1) contrast(1.4)';
        context.drawImage(photo, x, height * PHOTO_TOP, w, h);
        context.restore();
    }

    if (showAddress && address.length) {
        const size = Math.round(height * FONT_RATIO);

        context.font = `${size}px Menlo, Consolas, 'Lucida Console', monospace`;
        context.textAlign = 'left';
        context.textBaseline = 'alphabetic';
        context.lineJoin = 'round';
        context.lineWidth = size * OUTLINE_RATIO;
        context.strokeStyle = '#000000';
        context.fillStyle = '#ffffff';

        address.forEach((line, index) => {
            const y = height * ADDRESS_Y + index * size * LINE_HEIGHT;

            context.strokeText(line, x, y);
            context.fillText(line, x, y);
        });
    }
};
