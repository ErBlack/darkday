import { achievements } from './list.js';
import { showToast } from './toast.js';
import { playSound } from '../../engine/audio/play-sound.js';

const KEY = 'darkdayAchievements';
const SOUND = 'assets/sounds/achievement.mp3';

const read = () => {
    try {
        const saved = JSON.parse(localStorage.getItem(KEY));

        return Array.isArray(saved) ? saved : [];
    } catch {
        return [];
    }
};

const write = ids => {
    try {
        localStorage.setItem(KEY, JSON.stringify(ids));
    } catch {}
};

export class Achievements {
    #unlocked = read();

    get unlocked() {
        return this.#unlocked;
    }

    has(id) {
        return this.#unlocked.includes(id);
    }

    unlock(id) {
        if (this.has(id)) return;

        const achievement = achievements.find(entry => entry.id === id);

        if (!achievement) return;

        this.#unlocked = [...this.#unlocked, id];
        write(this.#unlocked);
        playSound(SOUND, { volume: 0.7 }).catch(() => {});
        showToast(achievement);
    }
}
