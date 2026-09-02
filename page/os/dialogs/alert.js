import { dialog } from './dialog.js';

export const alert = (text, { title, icon }) => dialog(text, { title, icon, buttons: [{ label: 'OK' }] });
