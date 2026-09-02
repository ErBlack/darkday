export const element = (tag, className, parent) => {
    const node = document.createElement(tag);
    node.className = className;
    parent?.append(node);

    return node;
};
