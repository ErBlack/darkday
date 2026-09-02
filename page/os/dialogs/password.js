import './dialog.css';
import { element } from '../dom/element.js';
import { push } from '../dom/push.js';

export const password = (text, { title, onSubmit, onCancel }) => ({
    title,
    dialog: true,
    mount(content, window) {
        content.classList.add('dialog');

        element('div', 'dialog-text', content).textContent = text;

        const field = element('label', 'dialog-field', content);
        field.append('Password:');
        const input = element('input', 'os-input', field);
        input.type = 'password';
        input.spellcheck = false;

        const row = element('div', 'dialog-buttons', content);
        const ok = push('OK', row);
        const cancel = push('Cancel', row);

        const submit = () => {
            window.close();
            onSubmit(input.value);
        };

        ok.addEventListener('click', submit);
        cancel.addEventListener('click', () => {
            window.close();
            onCancel?.();
        });
        input.addEventListener('keydown', event => {
            if (event.key === 'Enter') submit();
        });
        input.focus();
    },
});
