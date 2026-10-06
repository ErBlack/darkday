import { element } from '../../../dom/element.js';

export const renderKhaosPage = (parent, onSubmit) => {
    const page = element('div', 'browser-khaos', parent);
    const form = element('form', 'browser-khaos-form', page);
    const input = element('input', 'browser-khaos-input', form);
    input.type = 'password';
    input.placeholder = 'Password';
    input.spellcheck = false;
    const submit = element('button', 'browser-khaos-submit', form);
    submit.type = 'submit';
    submit.textContent = 'Submit';

    let submitting = false;

    form.addEventListener('submit', async event => {
        event.preventDefault();

        if (submitting) return;

        submitting = true;

        if (await onSubmit(input.value)) return;

        submitting = false;
        input.value = '';
        input.focus();
    });

    input.focus();

    return page;
};
