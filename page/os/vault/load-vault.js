const vaults = new Map();

export const loadVault = name => {
    if (!vaults.has(name)) {
        const loading = fetch(`assets/vaults/${name}.bin`)
            .then(response => response.arrayBuffer())
            .then(buffer => new Uint8Array(buffer));

        loading.catch(() => vaults.delete(name));
        vaults.set(name, loading);
    }

    return vaults.get(name);
};
