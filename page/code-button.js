const KEY = 'darkdayCode';
const COPIED_MS = 2000;

let button = null;
let timer = null;

const savedCode = () => {
    try {
        return localStorage.getItem(KEY);
    } catch {
        return null;
    }
};

export const showCodeButton = () => {
    const code = savedCode();

    if (!code) return;

    if (!button) {
        button = document.createElement('button');
        button.type = 'button';
        button.id = 'code';
        button.addEventListener('click', () => {
            clearTimeout(timer);
            navigator.clipboard.writeText(savedCode() ?? '').catch(() => {});
            button.textContent = 'code copied!';
            timer = setTimeout(() => {
                button.textContent = savedCode() ?? '';
            }, COPIED_MS);
        });
        document.getElementById('date').append(button);
    }

    button.textContent = code;
};
