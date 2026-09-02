import './run.css';
import { element } from '../dom/element.js';
import { icon } from '../dom/icon.js';
import { push } from '../dom/push.js';
import { alert } from '../dialogs/alert.js';
import { commands } from '../data/commands.js';

const HINT = 'Type the name of a program, folder, document, or Internet resource, and Windows will open it for you.';

const launch = (command, shell) => {
    const key = command.toLowerCase().replace(/\.exe$/, '');
    const entry = commands.find(entry => entry.names.includes(key));

    if (!entry || !shell.allowed(entry.app)) return false;

    shell.open(entry.app);

    return true;
};

const notFound = command => alert(
    `Windows cannot find '${command}'. Make sure you typed the name correctly, and then try again. To search for a file, click the Start button, and then click Search.`,
    { title: command, icon: 'error' },
);

export const run = {
    id: 'run',
    title: 'Run',
    icon: 'assets/os/icons/run.png',
    dialog: true,
    mount(content, window, shell) {
        content.classList.add('dialog', 'run');

        const body = element('div', 'dialog-body', content);
        icon(run.icon, '', body);
        element('div', 'dialog-text', body).textContent = HINT;

        const field = element('label', 'run-field', content);
        field.append('Open:');
        const input = element('input', 'os-input', field);
        input.spellcheck = false;

        const buttons = element('div', 'dialog-buttons', content);
        const ok = push('OK', buttons);
        const cancel = push('Cancel', buttons);

        const submit = () => {
            const command = input.value.trim();

            if (!command) return;
            if (launch(command, shell)) return window.close();

            window.open(notFound(command));
        };

        ok.addEventListener('click', submit);
        cancel.addEventListener('click', () => window.close());
        input.addEventListener('keydown', event => {
            if (event.key === 'Enter') submit();
        });
        input.focus();
    },
};
