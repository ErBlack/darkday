import { openFile } from '../../dialogs/open-file.js';

const TITLE = 'Choose File to Upload';

export const pickFile = (win, { fileSystem, flags, vaults, trash, unlock }, onPick) => {
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
