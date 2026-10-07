const SHIFT = 16;
const GROUP = 4;

export const BEER = '🍺';

const encrypt = digits => [...digits]
    .map((digit, index) => String.fromCharCode(digit.charCodeAt(0) + SHIFT + index))
    .join('')
    .replace(new RegExp(`(.{${GROUP}})(?=.)`, 'g'), '$1-');

export const winCode = ending => {
    const time = Math.floor(Date.now() / 10);
    const parity = ending === 'good' ? 0 : 1;
    const marked = time - (time % 2) + parity;

    return encrypt(String(marked));
};

export const decodeCode = code => {
    const digits = [...String(code).replaceAll(BEER, '').replace(/[-\s]/g, '')]
        .map((char, index) => String.fromCharCode(char.charCodeAt(0) - SHIFT - index))
        .join('');

    if (!/^\d+$/.test(digits)) return null;

    const time = Number(digits);

    return {
        ending: time % 2 === 0 ? 'good' : 'bad',
        max: String(code).includes(BEER),
        date: new Date(time * 10),
    };
};
