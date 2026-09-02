import './game-menu.css';
import { element } from '../../os/dom/element.js';
import { icon } from '../../os/dom/icon.js';
import { achievements } from '../achievements/list.js';
import { hidden } from '../achievements/hidden.js';

export class GameMenu {
    #root;
    #button;
    #grid;
    #load;
    #available;
    #unlocked;
    #canLoad;

    constructor({ available, unlocked, canLoad, onSave, onLoad, onNew, onExit }) {
        this.#available = available;
        this.#unlocked = unlocked;
        this.#canLoad = canLoad;

        this.#button = element('button', 'game-menu-button', document.body);
        this.#button.type = 'button';
        this.#button.textContent = 'Menu';
        this.#button.addEventListener('click', () => this.toggle());

        this.#root = element('div', 'game-menu game-menu-closed', document.body);

        const column = element('div', 'game-menu-column', this.#root);
        const list = element('nav', 'game-menu-items', column);

        const item = (label, action) => {
            const button = element('button', 'game-menu-item', list);
            button.type = 'button';
            button.textContent = label;
            button.addEventListener('click', () => {
                this.close();
                action();
            });

            return button;
        };

        item('Continue', () => {});
        item('Save game', onSave);
        this.#load = item('Load game', onLoad);
        item('New game', onNew);
        item('Exit', onExit);

        this.#grid = element('div', 'game-menu-achievements', column);

        addEventListener('keydown', this.#onKeyCapture, true);
        addEventListener('keydown', this.#onKey);
    }

    get opened() {
        return !this.#root.classList.contains('game-menu-closed');
    }

    open() {
        if (!this.#available()) return;

        this.#render();
        this.#load.disabled = !this.#canLoad();
        this.#root.classList.remove('game-menu-closed');
        this.#button.classList.add('game-menu-button-pressed');
    }

    close() {
        this.#root.classList.add('game-menu-closed');
        this.#button.classList.remove('game-menu-button-pressed');
    }

    toggle() {
        if (this.opened) this.close();
        else this.open();
    }

    #render() {
        const unlocked = this.#unlocked();

        this.#grid.replaceChildren();

        for (const achievement of achievements) {
            const done = unlocked.includes(achievement.id);
            const shown = achievement.hidden && !done ? hidden : achievement;
            const cell = element('div', 'game-menu-achievement', this.#grid);

            cell.classList.toggle('game-menu-locked', !done);
            icon(shown.icon, '', cell);
            element('strong', '', cell).textContent = shown.title;
            element('span', '', cell).textContent = shown.description;
        }
    }

    #onKeyCapture = event => {
        if (!this.opened) return;

        event.stopPropagation();

        if (event.key === 'Escape') this.close();
    };

    #onKey = event => {
        if (event.key !== 'Escape' || this.opened) return;

        this.open();
    };
}
