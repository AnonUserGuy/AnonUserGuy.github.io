import Color from "./net/xna-color.js";
import MapHelper from "./terraria-map-helper.js";
import MapTile, { TileGroup } from "./terraria-map-tile.js";
import WorldMap from "./terraria-world-map.js";

export default class WorldMapCanvas extends WorldMap {
    public canvases: OffscreenCanvas[];
    public canvasLighting: OffscreenCanvas;
    public canvasTilesPainted: OffscreenCanvas;
    public canvasTiles: OffscreenCanvas;
    public canvasWallsPainted: OffscreenCanvas;
    public canvasWalls: OffscreenCanvas;
    public canvasLiquids: OffscreenCanvas;
    public canvasAir: OffscreenCanvas;
    public canvasUnexplored: OffscreenCanvas;

    public canvasOutput: HTMLCanvasElement;

    private isDrawnAccurate: boolean;

    public static readonly layerNames = [
        "Lighting",
        "Tiles Painted",
        "Tiles",
        "Walls Painted",
        "Walls",
        "Liquids",
        "Air",
        "Unexplored/Explored"
    ]

    constructor(canvas: HTMLCanvasElement) {
        super(canvas.width, canvas.height);

        this.canvasOutput = canvas;
        this.isDrawnAccurate = false;

        this.canvases = [];
        this.canvases[0] = this.canvasLighting = new OffscreenCanvas(this._width, this._height);
        this.canvases[1] = this.canvasTilesPainted = new OffscreenCanvas(this._width, this._height);
        this.canvases[2] = this.canvasTiles = new OffscreenCanvas(this._width, this._height);
        this.canvases[3] = this.canvasWallsPainted = new OffscreenCanvas(this._width, this._height);
        this.canvases[4] = this.canvasWalls = new OffscreenCanvas(this._width, this._height);
        this.canvases[5] = this.canvasLiquids = new OffscreenCanvas(this._width, this._height);
        this.canvases[6] = this.canvasAir = new OffscreenCanvas(this._width, this._height);
        this.canvases[7] = this.canvasUnexplored = new OffscreenCanvas(this._width, this._height);

        for (const canvas of this.canvases) {
            canvas.getContext("2d")!.imageSmoothingEnabled = false;
        }
        this.canvasOutput.getContext("2d")!.imageSmoothingEnabled = false;
    }

    public updateDimensions() {
        super.updateDimensions();
        this.canvases.forEach(canvas => {
            canvas.width = this._width;
            canvas.height = this._height;
        })
        this.canvasOutput.width = this._width;
        this.canvasOutput.height = this._height;
        this.isDrawnAccurate = false;
    }

    public drawFast(layersActive: boolean[]) {
        const ctxOutput = this.canvasOutput.getContext("2d")!;
        ctxOutput.clearRect(0, 0, this._width, this._height);

        for (let i = this.canvases.length - 1; i >= 0; i--) {
            if (layersActive[i]) {
                this.drawCanvasFast(ctxOutput, this.canvases[i]);
            }
        }
        this.isDrawnAccurate = false;
    }

    private drawCanvasFast(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, canvas: OffscreenCanvas) {
        try {
            ctx.drawImage(canvas, 0, 0);
        } catch (e: any) {
            if (e.message !== "CanvasRenderingContext2D.drawImage: Passed-in canvas is empty") {
                throw e;
            }
        }
    }

    public drawAccurate(layersActive: boolean[]) {
        if (this.isDrawnAccurate) return;

        const ctxOutput = this.canvasOutput.getContext("2d")!;
        ctxOutput.clearRect(0, 0, this._width, this._height);

        const layersOut: OffscreenCanvas[] = [];
        for (let i = this.canvases.length - 1; i >= 0; i--) {
            if (layersActive[i]) {
                layersOut.push(this.canvases[i]);
            }
        }
        
        this.drawCanvasesAccurate(ctxOutput, layersOut);
        this.isDrawnAccurate = true;
    }

    private drawCanvasesAccurate(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, canvases: OffscreenCanvas[]) {
        if (this._width <= 0 || this._height <= 0) return;

        const out = new ImageData(this._width, this._height);
        for (const canvas of canvases) {
            const ctx2 = canvas.getContext("2d")!;
            const img = ctx2.getImageData(0, 0, this._width, this._height);
            this.blendImageData(out, img);
        }
        ctx.putImageData(out, 0, 0);
    }

    private drawLayers() {
        this.drawNormalLayers();
        this.drawLightingLayer();
        this.drawUnexploredLayer();
    }

    private drawNormalLayers() {
        for (let y = 0; y < this._height; y++) {
            for (let x = 0; x < this._width;) {
                const tile = this.tile(x, y);
                if (!tile) {
                    x++;
                    continue;
                }

                let x2 = x + 1;
                while (tile.EqualsWithoutLight(this.tile(x2, y)) && x2 < this._width) {
                    x2++;
                }

                this.drawTiles(x, y, x2 - x, 1, tile);
                x = x2;
            }
        }
    }

    private drawTiles(x: number, y: number, width: number, height: number, tile: MapTile) {
        let ctx: OffscreenCanvasRenderingContext2D;
        let ctx2: OffscreenCanvasRenderingContext2D;
        let color: Color;
        switch (tile.Group) {
            case TileGroup.Air:
            case TileGroup.DirtRock:
                color = MapHelper.GetMapTileXnaColor(tile);
                ctx = this.canvasAir.getContext("2d")!;
                this.drawNormalTiles(x, y, width, height, ctx, color);
                break;
            case TileGroup.Tile:
                color = MapHelper.GetMapTileXnaColor(tile);
                ctx = this.canvasTiles.getContext("2d")!;
                ctx2 = this.canvasTilesPainted.getContext("2d")!;
                this.drawNormalTiles(x, y, width, height, ctx, color);
                this.drawPaintedTiles(x, y, width, height, ctx2, color, tile);
                break;
            case TileGroup.Wall:
                color = MapHelper.GetMapTileXnaColor(tile);
                ctx = this.canvasWalls.getContext("2d")!;
                ctx2 = this.canvasWallsPainted.getContext("2d")!;
                this.drawNormalTiles(x, y, width, height, ctx, color);
                this.drawPaintedTiles(x, y, width, height, ctx2, color, tile);
                break;
            case TileGroup.Water:
            case TileGroup.Lava:
            case TileGroup.Honey:
                color = MapHelper.GetMapTileXnaColor(tile);
                ctx = this.canvasLiquids.getContext("2d")!;
                this.drawNormalTiles(x, y, width, height, ctx, color);
                break;
        }
    }

    private drawNormalTiles(x: number, y: number, width: number, height: number, ctx: OffscreenCanvasRenderingContext2D, color: Color) {
        ctx.fillStyle = color.toString();
        ctx.fillRect(x, y, width, height);
    }

    private drawPaintedTiles(x: number, y: number, width: number, height: number, ctx2: OffscreenCanvasRenderingContext2D, color: Color, tile: MapTile) {
        if (tile.Color > 0) {
            const colorPainted = color.copy();
            MapHelper.MapColor(tile.Type, colorPainted, tile.Color);
            ctx2!.fillStyle = colorPainted.toString();
            ctx2!.fillRect(x, y, width, height);
        }
    }

    private drawLightingLayer() {
        for (let y = 0; y < this._height; y++) {
            for (let x = 0; x < this._width;) {
                const tile = this.tile(x, y);
                if (!tile) {
                    x++;
                    continue;
                }

                let x2 = x + 1;
                let other = this.tile(x2, y);
                while (other && tile.Light === other.Light && x2 < this._width) {
                    x2++;
                    other = this.tile(x2, y);
                }

                this.drawLighting(x, y, x2 - x, 1, tile.Light);
                x = x2;
            }
        }
    }

    private drawLighting(x: number, y: number, width: number, height: number, light: number) {
        const ctx3 = this.canvasLighting.getContext("2d")!;
        ctx3.globalAlpha = 1 - light / 255;
        ctx3.fillRect(x, y, width, height);
    }

    private drawUnexploredLayer() {
        const ctx = this.canvasUnexplored.getContext("2d")!;
        ctx.fillStyle = "rgb(0 0 0)";
        ctx.fillRect(0, 0, this._width, this._height);

        const layersOpaque = [];
        for (let i = this.canvases.length - 2; i >= 1; i--) {
            layersOpaque.push(this.canvases[i]);
        }
        this.eraseCanvases(ctx, layersOpaque);

        ctx.globalCompositeOperation = "source-over";
    }

    public async read(data: (Uint8Array | ArrayBuffer)) {
        await super.read(data);
        this.drawLayers();
    }

    private blendImageData(dst: ImageData, src: ImageData) {
        const d = dst.data;
        const s = src.data;

        for (let i = 0; i < d.length; i += 4) {
            const sa = s[i + 3];
            if (sa === 0) continue;

            const da = d[i + 3];

            const saNorm = sa / 255;
            const daNorm = da / 255;

            const outA = saNorm + daNorm * (1 - saNorm);

            if (outA === 0) {
                d[i + 3] = 0;
                continue;
            }

            const invOutA = 1 / outA;

            d[i] = ((s[i] * saNorm + d[i] * daNorm * (1 - saNorm)) * invOutA) | 0;
            d[i + 1] = ((s[i + 1] * saNorm + d[i + 1] * daNorm * (1 - saNorm)) * invOutA) | 0;
            d[i + 2] = ((s[i + 2] * saNorm + d[i + 2] * daNorm * (1 - saNorm)) * invOutA) | 0;
            d[i + 3] = (outA * 255) | 0;
        }
    }

    private eraseCanvases(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, canvases: OffscreenCanvas[]) {
        const out = ctx.getImageData(0, 0, this._width, this._height);
        for (const canvas of canvases) {
            const ctx2 = canvas.getContext("2d")!;
            const img = ctx2.getImageData(0, 0, this._width, this._height);
            this.eraseImageData(out, img);
        }
        ctx.putImageData(out, 0, 0);
    }

    private eraseImageData(dst: ImageData, src: ImageData) {
        const d = dst.data;
        const s = src.data;

        for (let i = 0; i < d.length; i += 4) {
            const sa = s[i + 3];
            if (sa !== 0) {
                d[i + 3] = 0;
            } 
        }
    }
}