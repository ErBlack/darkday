import { crypTool } from '../apps/cryptool/cryptool.js';
import { cannotOpen } from './cannot-open.js';

const folder = (name, children) => ({ name, icon: 'folder', children });
const denied = name => ({ name, icon: 'folder' });
const file = (name, icon = 'file') => ({ name, icon });

export const fileSystem = {
    name: 'My Computer',
    icon: 'computer',
    children: [
        {
            name: '3½ Floppy (A:)',
            icon: 'floppy',
            path: 'A:\\',
            device: 'floppy',
            error: 'A:\\ is not accessible.\n\nThe device is not ready.',
        },
        {
            name: 'Local Disk (C:)',
            icon: 'drive',
            path: 'C:\\',
            children: [
                folder('Documents and Settings', [
                    denied('Administrator'),
                    denied('All Users'),
                    denied('Default User'),
                    denied('L'),
                ]),
                folder('Program Files', [
                    denied('Common Files'),
                    denied('Internet Explorer'),
                    denied('Messenger'),
                    denied('Movie Maker'),
                    denied('Outlook Express'),
                    denied('Windows Media Player'),
                    denied('Windows NT'),
                    file('desktop.ini'),
                ]),
                folder('WINDOWS', [
                    denied('Fonts'),
                    denied('Help'),
                    denied('inf'),
                    denied('Media'),
                    denied('Prefetch'),
                    denied('Resources'),
                    denied('system32'),
                    denied('Temp'),
                    file('Blue Lace 16.bmp'),
                    file('clock.avi'),
                    file('explorer.exe', 'system-file'),
                    file('notepad.exe', 'system-file'),
                    file('regedit.exe', 'system-file'),
                    file('setuplog.txt'),
                    file('system.ini'),
                    file('win.ini'),
                    file('WindowsUpdate.log'),
                ]),
                file('AUTOEXEC.BAT'),
                file('boot.ini'),
                file('CONFIG.SYS'),
                file('IO.SYS', 'system-file'),
                file('MSDOS.SYS', 'system-file'),
                file('NTDETECT.COM', 'system-file'),
                file('ntldr', 'system-file'),
                file('pagefile.sys', 'system-file'),
            ],
        },
        {
            name: 'Removable Disk (E:)',
            icon: 'removable',
            path: 'E:\\',
            when: ({ flashInserted }) => flashInserted,
            vault: 'flash',
            children: [
                {
                    name: 'Explosives.bin',
                    icon: 'binary',
                    error: cannotOpen('Explosives.bin'),
                },
                { name: 'Notes.sec', icon: 'cryptool', app: crypTool },
            ],
        },
        {
            name: 'Recycle Bin',
            icon: 'recycle-bin',
            path: 'Recycle Bin',
            children: [],
        },
    ],
};
