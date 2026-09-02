const PAYLOAD = 'Explosives.bin';
const PAYLOAD_SIZE = '15.0 MB';
const UPLOAD_MS = 9000;
const CRASH_DELAY_MS = 2500;
const SUCCESS_MS = 500;
const ENDING_DELAY_MS = 2000;

const flash = document.querySelector('.flash');
const rows = document.querySelector('.objects tbody');
const upload = document.querySelector('[data-action=upload]');
const run = document.querySelector('[data-action=run]');
const refresh = document.querySelector('[data-action=refresh]');

let uploading = false;

const show = (kind, html) => {
    flash.className = `flash flash-${kind}`;
    flash.innerHTML = html;
    flash.hidden = false;
};

const addRow = () => {
    const row = document.createElement('tr');
    row.className = 'object-new';

    for (const text of [PAYLOAD, 'bin', PAYLOAD_SIZE, 'Standard']) {
        const cell = document.createElement('td');
        cell.textContent = text;
        row.append(cell);
    }

    row.firstChild.innerHTML = `<span class="object">${PAYLOAD}</span>`;
    rows.prepend(row);
};

const accept = () => {
    uploading = true;
    upload.disabled = true;
    show('progress', `Uploading <b>${PAYLOAD}</b> to s3://civis-internal/uploads/<div class="progress" style="--duration: ${UPLOAD_MS}ms"><div></div></div>`);

    setTimeout(() => {
        uploading = false;
        addRow();
        show('success', `Upload succeeded. <b>1 object</b>, ${PAYLOAD_SIZE}.`);
        run.disabled = false;
        parent.postMessage({ type: 'civis-uploaded' }, location.origin);
    }, UPLOAD_MS);
};

const reject = name => {
    show('error', `Upload failed. <b>${name}</b>: file type is not allowed by bucket policy.`);
};

upload.addEventListener('click', () => {
    if (!uploading) parent.postMessage({ type: 'pick-file' }, location.origin);
});

const crash = () => {
    parent.postMessage({ type: 'payload-crash' }, location.origin);
    document.title = '500 Internal Server Error';
    document.head.querySelectorAll('link[rel=stylesheet]').forEach(link => link.remove());
    document.body.className = '';
    document.body.style.cssText = 'margin: 0; padding: 32px; background: #fff; color: #000; font: 16px/1.5 Times, serif;';
    document.body.innerHTML = '<h1 style="margin: 0 0 12px; font-size: 32px;">500 Internal Server Error</h1><p style="margin: 0;">The server encountered an internal error and was unable to complete your request.</p>';
};

run.addEventListener('click', () => {
    run.disabled = true;
    show('progress', `Running <b>${PAYLOAD}</b>…<div class="progress progress-endless"><div></div></div>`);
    setTimeout(() => {
        show('success', `<b>${PAYLOAD}</b> executed successfully.`);
        setTimeout(() => {
            crash();
            setTimeout(() => parent.postMessage({ type: 'payload-run' }, location.origin), ENDING_DELAY_MS);
        }, SUCCESS_MS);
    }, CRASH_DELAY_MS);
});

refresh.addEventListener('click', () => {
    if (!uploading && !flash.classList.contains('flash-progress')) flash.hidden = true;
});

document.querySelector('.console-signout').addEventListener('click', () => {
    parent.postMessage({ type: 'civis-logout' }, location.origin);
    location.href = 'login.html';
});

const restore = ({ session, uploaded }) => {
    if (!session) return location.replace('login.html');

    if (uploaded) {
        addRow();
        upload.disabled = true;
        run.disabled = false;
    }

    document.body.classList.remove('pending');
};

addEventListener('message', event => {
    if (event.origin !== location.origin) return;
    if (event.data?.type === 'civis-state') return restore(event.data);
    if (event.data?.type !== 'file-picked') return;

    if (event.data.name === PAYLOAD) accept();
    else reject(event.data.name);
});

parent.postMessage({ type: 'civis-state' }, location.origin);
