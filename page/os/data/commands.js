import { explorer } from '../apps/explorer.js';
import { browser } from '../apps/browser/browser.js';
import { dayOne } from '../apps/dayone.js';
import { maps } from '../apps/maps/maps.js';
import { mirror } from '../apps/mirror.js';
import { crypTool } from '../apps/cryptool/cryptool.js';
import { taskManager } from '../apps/task-manager.js';

export const commands = [
    { names: ['explorer', 'mycomputer'], app: explorer },
    { names: ['browser', 'iexplore'], app: browser },
    { names: ['dayone'], app: dayOne },
    { names: ['maps'], app: maps },
    { names: ['mirror'], app: mirror },
    { names: ['cryptool'], app: crypTool },
    { names: ['taskmgr', 'taskmanager'], app: taskManager },
];
