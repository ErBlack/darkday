const same = (a, b) => a.toLowerCase() === b.toLowerCase();

export const findNode = (root, path, flags) => {
    const [drive, ...names] = path.trim().replace(/^"|"$/g, '').replace(/\//g, '\\').split('\\').filter(Boolean);
    const visible = node => node.when?.(flags) ?? true;
    const disk = drive && root.children.find(node => node.path && visible(node) && same(node.path, `${drive}\\`));

    if (!disk) return null;

    const trail = [root, disk];

    for (const name of names) {
        const next = trail.at(-1).children?.find(node => visible(node) && same(node.name, name));

        if (!next) return null;

        trail.push(next);
    }

    return trail;
};
