import MapTile, { TileGroup } from "./terraria-map-tile.js";
import MapHelper from "./terraria-map-helper.js";
import BinaryReader from "./net/binary-reader.js";
import BinaryWriter from "./net/binary-writer.js";

export default class WorldMap {

    protected _width: number;
    protected _height: number;

    private airTilesDepths: number[];
    private airTiles: MapTile[];
    public tiles: MapTile[];

    public worldName?: string;
    public worldId?: number;
    public release?: number;
    public revision?: number;
    public isChinese?: boolean;

    public worldSurface?: number;
    public worldSurfaceEstimated?: boolean;
    public rockLayer?: number;

    constructor(width = 0, height = 0) {
        this._width = width;
        this._height = height;
        this.airTilesDepths = [];
        this.airTiles = [];
        this.tiles = [];
    }

    public get width() {
        return this._width;
    }
    public set width(val: number) {
        this._width = val;
        this.updateDimensions();
    }

    public get height() {
        return this._height;
    }
    public set height(val: number) {
        this._height = val;
        this.updateDimensions();
    }

    public setDimensions(w: number, h: number) {
        this._width = w;
        this._height = h;
        this.updateDimensions();
    }

    public updateDimensions() {
        this.tiles = Array(this._height * this._width);
    }

    public SetTile(x: number, y: number, tile: MapTile) {
        if (tile.Group === TileGroup.Air && tile !== this.airTiles[this.airTiles.length - 1]) {
            this.airTiles.push(tile);
            this.airTilesDepths.push(y);
        }
        this.tiles[y * this._width + x] = tile;
    }

    public tile(x: number, y: number) {
        return this.tiles[y * this._width + x];
    }

    private fixAirTiles() {
        for (let i = 0; i < this.airTiles.length; i++) {
            const tile = this.airTiles[i];
            const y = this.airTilesDepths[i];
            tile.Type = MapHelper.GetMapAirTile(y, this.worldSurface!);
        }
        this.airTiles = [];
        this.airTilesDepths = [];
    }

    public async read(data: (Uint8Array | ArrayBuffer)) {
        const reader = new BinaryReader(data);
        await MapHelper.Load(reader, this);
        this.fixAirTiles();
    }

    public writeSchematic() {
        const writer = new BinaryWriter();
        MapHelper.WriteSchematic(writer, this);
        writer.trim();
        return writer.data.buffer;
    }
}