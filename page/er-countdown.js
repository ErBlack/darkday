class ErCountdown extends HTMLElement {
    #timeout;
    #date;
    #span;
    #showDate = false;
    #intervals = [1000, 60, 60, 24, 7];
    static get observedAttributes() {
        return ['date'];
    }
    constructor() {
        super();

        this.#span = document.createElement('span');

        this.#span.addEventListener('click', () => {
            this.#showDate = !this.#showDate;
            this.#render();
        });

        this.attachShadow({ mode: 'closed' }).appendChild(this.#span);
    }

    #offset(start, from = new Date()) {
        let offset = Number(start) - Number(from);
        let direction = offset > 0 ? 1 : offset < 0 ? -1 : 0;

        offset = Math.abs(offset);

        let result = this.#intervals.map(function (value) {
            var result = offset % value;

            offset = (offset - result) / value;

            return result;
        });

        return {
            milliseconds: result[0],
            seconds: result[1],
            minutes: result[2],
            hours: result[3],
            days: result[4],
            weeks: offset,
            direction,
        };
    }

    #render() {
        clearTimeout(this.#timeout);

        if (this.#showDate) {
            this.#span.textContent = this.#date.toLocaleString();
            return;
        }

        const { direction, weeks, days, hours, minutes, seconds } = this.#offset(this.#date);

        if (direction === 1) {
            const result = [];

            if (weeks) {
                result.push(`${weeks}w`);
            }
            if (days) {
                result.push(`${days}d`);
            }
            if (hours) {
                result.push(`${hours}h`);
            }
            if (minutes || hours) {
                result.push(`${minutes}m`);
            }

            result.push(`${seconds}s`);

            this.#span.textContent = result.join(' ');

            this.#timeout = setTimeout(() => {
                this.#render();
            }, 1000);
        } else {
            this.#span.textContent = 'now';
        }
    }

    connectedCallback() {
        this.#date = new Date(this.getAttribute('date'));
        this.#render();
    }

    disconnectedCallback() {
        clearTimeout(this.#timeout);
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'date') {
            this.#date = new Date(newValue);
            this.#render();
        }
    }
}

customElements.define('er-countdown', ErCountdown);
