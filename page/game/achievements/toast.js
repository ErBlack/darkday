import './toast.css';
import { element } from '../../os/dom/element.js';
import { icon } from '../../os/dom/icon.js';

const SHOW_MS = 5000;
const FADE_MS = 400;

let holder = null;

export const showToast = ({ title, description, icon: src }) => {
    if (!holder?.isConnected) holder = element('div', 'achievement-toasts', document.body);

    const toast = element('div', 'achievement-toast', holder);
    icon(src, 'achievement-toast-icon', toast);

    const text = element('div', 'achievement-toast-text', toast);
    element('span', 'achievement-toast-label', text).textContent = 'Achievement unlocked';
    element('strong', 'achievement-toast-title', text).textContent = title;
    element('span', 'achievement-toast-description', text).textContent = description;

    toast.getBoundingClientRect();
    toast.classList.add('achievement-toast-shown');

    setTimeout(() => {
        toast.classList.remove('achievement-toast-shown');
        setTimeout(() => toast.remove(), FADE_MS);
    }, SHOW_MS);
};
