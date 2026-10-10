const page = location.pathname.split('/').pop();

for (const link of document.querySelectorAll('.site-nav a')) {
    link.classList.toggle('active', link.getAttribute('href') === page);
}

const STORAGE_ACCOUNT = 'bfcd676791d4d0e59e2f63142b408495d039e7da6f3835c3a7b61544a6b58ee8';
const PASSWORD = 'e39764959eb8b3435ca67436cf8ea66a19f00bdd94cd94b0b76e85075125f158';

const sha256 = async text => {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));

    return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
};

const login = document.querySelector('.auth-form');

if (login) {
    const note = login.querySelector('.form-note');
    const email = login.querySelector('input[type=email]');
    const password = login.querySelector('input[type=password]');
    const matches = async () => await sha256(`${email.value.trim().toLowerCase()}:${password.value}`) === STORAGE_ACCOUNT;

    login.addEventListener('input', async () => {
        if (await sha256(password.value) === PASSWORD) parent.postMessage({ type: 'civis-password' }, location.origin);
    });

    login.addEventListener('submit', async event => {
        event.preventDefault();

        if (await matches()) {
            parent.postMessage({ type: 'civis-login', password: password.value }, location.origin);
            location.href = 'storage.html';

            return;
        }

        note.textContent = `We couldn’t find an account for ${email.value.trim() || 'this address'}. Check the address or contact your administrator.`;
        note.hidden = false;
        login.querySelector('input[type=password]').value = '';
        email.focus();
    });
}

const contact = document.querySelector('.contact-form');

if (contact) {
    const note = contact.querySelector('.form-note');

    contact.addEventListener('submit', event => {
        event.preventDefault();
        contact.reset();
        note.textContent = 'Thank you. A member of our team will be in touch within two business days.';
        note.hidden = false;
    });
}
