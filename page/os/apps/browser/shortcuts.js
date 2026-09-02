export const browserShortcut = event => {
    const ctrl = event.ctrlKey || event.metaKey;

    if (ctrl && event.key === 't') return 'newTab';
    if (ctrl && event.key === 'w') return 'closeTab';
    if ((ctrl && event.key === 'l') || event.key === 'F6') return 'focusAddress';
    if (event.key === 'F5' || (ctrl && event.key === 'r')) return 'reload';
    if (event.altKey && event.key === 'ArrowLeft') return 'back';
    if (event.altKey && event.key === 'ArrowRight') return 'forward';
    if (ctrl && event.key === 'Tab') return event.shiftKey ? 'previousTab' : 'nextTab';
    if (event.key === 'Escape') return 'stop';

    return null;
};
