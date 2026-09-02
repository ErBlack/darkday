import { run } from './apps/run.js';
import { explorer } from './apps/explorer.js';
import { mirror } from './apps/mirror.js';
import { maps } from './apps/maps/maps.js';
import { browser } from './apps/browser/browser.js';
import { dayOne } from './apps/dayone.js';
import { taskManager } from './apps/task-manager.js';
import { crypTool } from './apps/cryptool/cryptool.js';
import { confirm } from './dialogs/confirm.js';

const PROGRAMS = [
    { label: 'Browser', icon: browser.icon, app: browser },
    { label: 'DayOne', icon: dayOne.icon, app: dayOne },
    { label: 'Maps', icon: maps.icon, app: maps },
    { label: 'Mirror', icon: mirror.icon, app: mirror },
    { label: 'CrypTool', icon: crypTool.icon, app: crypTool },
];

export const startItemsFor = allowed => [
    {
        label: 'Programs',
        icon: 'assets/os/icons/programs.png',
        items: PROGRAMS.filter(item => allowed(item.app)),
    },
    { label: 'My Computer', icon: explorer.icon, app: explorer },
    { label: 'Task Manager', icon: taskManager.icon, app: taskManager },
    { label: 'Run...', icon: run.icon, app: run },
    null,
    {
        label: 'Shut Down',
        icon: 'assets/os/icons/shutdown.png',
        items: [
            { label: 'Stand By', icon: 'assets/os/icons/standby.png', run: ({ standBy }) => standBy() },
            {
                label: 'Log Off...',
                icon: 'assets/os/icons/logoff.png',
                run: shell => shell.open(confirm('Are you sure you want to log off?', {
                    title: 'Log Off Windows',
                    icon: 'question',
                    onConfirm: () => shell.logOff(),
                })),
            },
            {
                label: 'Turn Off...',
                icon: 'assets/os/icons/shutdown.png',
                run: shell => shell.open(confirm('Are you sure you want to turn off the computer?', {
                    title: 'Turn Off Computer',
                    icon: 'question',
                    onConfirm: () => shell.shutDown(),
                })),
            },
        ],
    },
];
