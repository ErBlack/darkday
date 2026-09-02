export const unpack = bytes => {
    const length = new DataView(bytes.buffer, bytes.byteOffset, 4).getUint32(0, true);
    const header = JSON.parse(new TextDecoder().decode(bytes.subarray(4, 4 + length)));
    const ranges = new Map();
    const urls = new Map();
    let offset = 4 + length;

    for (const file of header.files) {
        ranges.set(file.name, { start: offset, end: offset + file.size, type: file.type });
        offset += file.size;
    }

    const url = name => {
        if (!urls.has(name)) {
            const range = ranges.get(name);

            urls.set(name, URL.createObjectURL(new Blob([bytes.subarray(range.start, range.end)], { type: range.type })));
        }

        return urls.get(name);
    };

    return { data: header.data, url, has: name => ranges.has(name) };
};
