import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, extname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SECRETS = resolve(ROOT, 'secrets');
const OUT = resolve(ROOT, 'page/public/assets/vaults');
const ITERATIONS = 300000;
const TYPES = {
    '.webp': 'image/webp',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.mp4': 'video/mp4',
    '.mp3': 'audio/mpeg',
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
};

const pad = value => String(value).padStart(2, '0');

const local = date => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;

const replacer = function (key, value) {
    return this[key] instanceof Date ? local(this[key]) : value;
};

const deriveKey = async (password, salt) => {
    const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);

    return crypto.subtle.deriveKey(
        { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' },
        material,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt'],
    );
};

const pack = async (data, media) => {
    const files = [];
    const chunks = [];

    if (media) {
        for (const name of (await readdir(media)).sort()) {
            const bytes = await readFile(resolve(media, name));

            files.push({ name, type: TYPES[extname(name)], size: bytes.length });
            chunks.push(bytes);
        }
    }

    const header = new TextEncoder().encode(JSON.stringify({ data, files }, replacer));
    const length = new Uint8Array(4);

    new DataView(length.buffer).setUint32(0, header.length, true);

    return Buffer.concat([length, header, ...chunks]);
};

const { vaults } = await import(pathToFileURL(resolve(SECRETS, 'vaults.js')));

await mkdir(OUT, { recursive: true });

for (const vault of vaults) {
    const data = await import(pathToFileURL(resolve(SECRETS, vault.data)));
    const plain = await pack({ ...data }, vault.media && resolve(SECRETS, vault.media));
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKey(vault.password, salt);
    const cipher = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plain));
    const target = resolve(OUT, `${vault.name}.bin`);

    await writeFile(target, Buffer.concat([salt, iv, cipher]));
    console.log(`${vault.name}.bin ${(cipher.length / 1024).toFixed(0)} KiB`);
}
