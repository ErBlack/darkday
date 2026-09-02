export class DebugLayer {
    constructor(getHotspots) {
        this.getHotspots = getHotspots;
    }

    draw(renderer) {
        for (const { rect } of this.getHotspots()) {
            renderer.fillRect(rect, [1, 0, 0, 0.15]);
            renderer.strokeRect(rect, [1, 0, 0, 0.8], 4);
        }
    }
}
