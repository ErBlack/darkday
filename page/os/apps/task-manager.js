import './task-manager.css';
import { element } from '../dom/element.js';
import { icon } from '../dom/icon.js';
import { push } from '../dom/push.js';
import { confirm } from '../dialogs/confirm.js';

const TICK_MS = 1000;
const COLUMNS = ['Application', 'Memory', 'CPU', 'Status'];

const formatMemory = value => `${value.toLocaleString('en-US')} K`;
const formatCpu = value => String(value).padStart(2, '0');

export const taskManager = {
    id: 'task-manager',
    title: 'Task Manager',
    icon: 'assets/os/icons/task-manager.png',
    single: true,
    size: { w: 440, h: 320 },
    usage: { memory: [3600, 4400], cpu: [1, 4] },
    mount(content, win, { processes }) {
        content.classList.add('os-pane', 'task-manager');

        const list = element('div', 'os-panel task-manager-list', content);
        const head = element('div', 'task-manager-head', list);

        for (const column of COLUMNS) element('span', '', head).textContent = column;

        const rows = element('div', 'task-manager-rows', list);
        const footer = element('div', 'task-manager-footer', content);
        const endTask = push('End Task', footer);

        let selected = null;

        const render = () => {
            const entries = processes.list();

            if (!entries.some(entry => entry.app === selected)) selected = null;

            rows.replaceChildren();

            for (const entry of entries) {
                const row = element('div', 'task-manager-row', rows);
                row.classList.toggle('task-manager-selected', entry.app === selected);

                const name = element('span', 'task-manager-name', row);
                icon(entry.app.icon, '', name);
                name.append(entry.app.title);

                element('span', '', row).textContent = formatMemory(entry.memory);
                element('span', '', row).textContent = formatCpu(entry.cpu);
                element('span', '', row).textContent = entry.responding ? 'Running' : 'Not Responding';

                row.addEventListener('click', () => {
                    selected = entry.app;
                    render();
                });
            }

            endTask.disabled = !selected;
        };

        endTask.addEventListener('click', () => {
            const target = selected;

            win.open(confirm(`Do you want to end '${target.title}'?`, {
                title: 'End Task',
                icon: 'question',
                onConfirm: () => {
                    processes.kill(target);
                    render();
                },
            }));
        });

        const timer = setInterval(() => {
            processes.tick();
            render();
        }, TICK_MS);

        win.onClose = () => clearInterval(timer);
        render();
    },
};
