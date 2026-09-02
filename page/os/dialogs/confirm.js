import { dialog } from './dialog.js';

export const confirm = (text, { title, icon, onConfirm }) => dialog(text, {
    title,
    icon,
    buttons: [{ label: 'Yes', action: onConfirm }, { label: 'No' }],
});
