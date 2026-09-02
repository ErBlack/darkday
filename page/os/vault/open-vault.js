import { deriveKey } from './derive-key.js';
import { unpack } from './unpack.js';
import { loadVault } from './load-vault.js';

const SALT = 16;
const IV = 12;

export const openVault = async (name, password) => {
    const bytes = await loadVault(name);
    const key = await deriveKey(password, bytes.subarray(0, SALT));

    try {
        const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: bytes.subarray(SALT, SALT + IV) }, key, bytes.subarray(SALT + IV));

        return unpack(new Uint8Array(plain));
    } catch {
        return null;
    }
};
