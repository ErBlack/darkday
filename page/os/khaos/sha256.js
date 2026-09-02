export const sha256 = async text => {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));

    return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
};
