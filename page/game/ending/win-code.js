const SHIFT = 16;
const GROUP = 4;

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
