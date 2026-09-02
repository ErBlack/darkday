import { alert } from '../../dialogs/alert.js';
import { openFile } from '../../dialogs/open-file.js';
import { explorer } from '../explorer.js';

const TITLE = 'Choose File to Upload';
const NO_ACCESS = 'Windows cannot access the specified device, path, or file. You may not have the appropriate permissions to access the item.';

export const pickFile = (win, { allowed, fileSystem, flags, vaults, trash, unlock }, onPick) => {
    if (!allowed(explorer)) return win.open(alert(NO_ACCESS, { title: TITLE, icon: 'error' }));

    win.open(openFile({
        title: TITLE,
        icon: 'assets/os/icons/browser.png',
        root: fileSystem,
        flags,
        vaults,
        trash,
        onUnlock: unlock,
        onOpen: ({ node }) => onPick(node.name),
    }));
};
