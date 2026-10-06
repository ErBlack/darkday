import './logon.css';
import { element } from '../dom/element.js';
import { icon } from '../dom/icon.js';
import { openVault } from '../vault/open-vault.js';

const LOADING_MS = 900;
const FORGOT = "Did you forget your password? You can click the \"?\" button to see your password hint.";

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

export class Logon {
    #root;
    #left;
    #tiles = new Map();
    #onLogon;

    constructor(parent, users, { onLogon, onTurnOff }) {
        this.#onLogon = onLogon;
        this.#root = element('div', 'logon', parent);
        element('div', 'logon-top', this.#root);

        const main = element('div', 'logon-main', this.#root);
        this.#left = element('div', 'logon-left', main);
        element('span', '', this.#left).textContent = 'To begin, click your user name';

        const list = element('div', 'logon-users', main);

        for (const user of users) this.#tile(user, list);

        const bottom = element('div', 'logon-bottom', this.#root);
        const off = element('button', 'logon-off', bottom);
        off.type = 'button';
        icon('assets/os/icons/shutdown.png', '', off);
        off.append('Turn off computer');
        off.addEventListener('click', onTurnOff);
        element('div', 'logon-note', bottom).textContent = 'After you log on, you can add or change accounts.\nJust go to Control Panel and click User Accounts.';
    }

    #tile(user, list) {
        const tile = element('div', 'logon-user', list);
        const picture = element('div', 'logon-picture', tile);

        if (user.picture) icon(user.picture, '', picture);
        const body = element('div', 'logon-user-body', tile);
        element('div', 'logon-name', body).textContent = user.name;

        this.#tiles.set(user, { tile, body });

        tile.addEventListener('click', event => {
            if (event.target.closest('input, button')) return;

            this.#select(user);
        });
    }

    #select(user) {
        if (!user.vault) return this.#enter(user, null);

        const { tile, body } = this.#tiles.get(user);

        if (tile.classList.contains('logon-user-active')) return;

        for (const entry of this.#tiles.values()) {
            entry.tile.classList.remove('logon-user-active');
            entry.body.querySelectorAll('.logon-prompt, .logon-field, .logon-message').forEach(node => node.remove());
        }

        tile.classList.add('logon-user-active');
        this.#root.classList.add('logon-dim');

        element('div', 'logon-prompt', body).textContent = 'Type your password';

        const field = element('div', 'logon-field', body);
        const input = element('input', 'logon-input', field);
        input.type = 'password';
        input.spellcheck = false;
        const go = element('button', 'logon-go', field);
        go.type = 'button';
        icon('assets/os/icons/go.png', '', go);
        const help = element('button', 'logon-help', field);
        help.type = 'button';
        icon('assets/os/icons/question.png', '', help);
        const message = element('div', 'logon-message', body);

        let submitting = false;

        const submit = async () => {
            if (submitting) return;

            submitting = true;

            const vault = await openVault(user.vault, input.value);

            if (vault) return this.#enter(user, vault, input.value);

            submitting = false;
            input.value = '';
            message.textContent = FORGOT;
            input.focus();
        };

        go.addEventListener('click', submit);
        help.addEventListener('click', () => {
            message.textContent = user.hint;
            input.focus();
        });
        input.addEventListener('keydown', event => {
            if (event.key === 'Enter') submit();
        });
        input.focus();
    }

    async #enter(user, vault, password = null) {
        const main = this.#root.querySelector('.logon-main');

        this.#root.classList.remove('logon-dim');
        main.className = 'logon-loading';
        main.replaceChildren();
        main.textContent = 'Loading your personal settings...';
        await wait(LOADING_MS);
        this.#root.remove();
        this.#onLogon(user, vault, password);
    }
}
