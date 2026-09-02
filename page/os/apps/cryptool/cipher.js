export const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export const encrypt = (text, key) => [...text].map(char => {
    const upper = char.toUpperCase();
    const index = ALPHABET.indexOf(upper);

    if (index === -1) return char;

    const cipher = key[index];

    return char === upper ? cipher : cipher.toLowerCase();
}).join('');
