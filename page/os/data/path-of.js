export const pathOf = trail => {
    const [root, ...rest] = trail;
    let path = root.path ?? root.name;

    for (const node of rest) {
        if (node.path) path = node.path;
        else path = path.endsWith('\\') ? path + node.name : `${path}\\${node.name}`;
    }

    return path;
};
