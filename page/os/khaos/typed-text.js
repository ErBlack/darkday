const CHARS_PER_SECOND = 28;
const SCRAMBLED = 3;
const GLYPHS = '!<>-_\\/[]{}=+*^?#01ΔΞΨΩ';

const glyph = () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)];

export const typedText = (text, elapsed) => {
    const shown = Math.floor(elapsed / 1000 * CHARS_PER_SECOND);

    if (shown >= text.length) return text;

    const noise = Array.from({ length: Math.min(SCRAMBLED, text.length - shown) }, glyph).join('');

    return text.slice(0, shown) + noise;
};
