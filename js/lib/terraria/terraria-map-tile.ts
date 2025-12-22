import PaintID from "./id/paint-ids.js";
import TileID from "./id/tile-ids.js";
import WallID from "./id/wall-ids.js";

export enum TileGroup {
    Empty,
    Tile,
    Wall,
    Water,
    Lava,
    Honey,
    Air,
    DirtRock
}

export default class MapTile {
    public Type: number;
    public Light: number;
    private _extraData: number;
    public Group: number;
    public ID: number | undefined;
    public Option: number | undefined;

    public static Air = MapTile.Create(0, 255, 0, TileGroup.Air);
    public static ShadowDirt = MapTile.Create(1, 0, PaintID.ShadowPaint, TileGroup.Tile, TileID.Dirt, 0);
    public static anyWall = MapTile.Create(1, 0, 0, TileGroup.Wall, WallID.DirtUnsafe, 0);

    constructor(type: number, light: number, extraData: number, group: number, id: number | undefined, option: number | undefined) {
        this.Type = type;
        this.Light = light;
        this._extraData = extraData;

        this.Group = group;
        this.ID = id;
        this.Option = option;
    }

    public get Color() {
        return this._extraData & 127;
    }
    public set Color(value: number) {
        this._extraData = (this._extraData & 128) | (value & 127);
    }

    public WithLight(light: number) {
        return new MapTile(this.Type, light, this._extraData | 128, this.Group, this.ID, this.Option);
    }

    public static Create(type: number, light: number, color: number, group: number, id?: number | undefined, option?: number | undefined) {
        return new MapTile(type, light, color | 128, group, id, option);
    }

    public Equals(other: MapTile) {
        return !!other && this.Type === other.Type && this.Light === other.Light && this.Color === other.Color;
    }

    public EqualsAfterExport(other: MapTile) {
        return !!other && (this.Type === other.Type
            || ((this.Group === TileGroup.Air || this.Group === TileGroup.DirtRock)
            && (other.Group === TileGroup.Air || other.Group === TileGroup.DirtRock)))
            && this.Color === other.Color;
    }

    public EqualsWithoutLight(other: MapTile) {
        return !!other && this.Type === other.Type && this.Color === other.Color;
    }

    public toString() {
        let str;
        if (this.Group === TileGroup.DirtRock) {
            str = "Underground Air";
        } else if (this.Group === TileGroup.Water && this.ID === 3) {
            str = "Shimmer";
        } else {
            str = TileGroup[this.Group];
        }
        str += `, light: ${this.Light}`;
        if (this.Group === TileGroup.Tile || this.Group === TileGroup.Wall) {
            str += `, paint: ${PaintID[this.Color]} (${this.Color}), type: ${this.Group === TileGroup.Tile ? TileID[this.ID!] : WallID[this.ID!]} (${this.ID!}), option: ${this.Option!}`;
        }
        return str;
    }
}
