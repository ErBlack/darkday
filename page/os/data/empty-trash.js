import { confirm } from '../dialogs/confirm.js';
import { playSystemSound } from '../audio/play-system-sound.js';

const RECYCLE_SOUND = 'assets/sounds/recycle.mp3';

const question = items => (items.length === 1
    ? `Are you sure you want to delete '${items[0].name}'?`
    : `Are you sure you want to delete these ${items.length} items?`);

export const emptyTrash = (open, trash) => {
    if (!trash.items.length) return;

    open(confirm(question(trash.items), {
        title: trash.items.length === 1 ? 'Confirm File Delete' : 'Confirm Multiple File Delete',
        icon: 'question',
        onConfirm: () => {
            trash.empty();
            playSystemSound(RECYCLE_SOUND, { volume: 0.6 }).catch(() => {});
        },
    }));
};
