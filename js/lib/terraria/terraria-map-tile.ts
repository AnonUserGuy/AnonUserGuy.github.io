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

    constructor(type: number, light: number, extraData: number, group: number) {
        this.Type = type;
        this.Light = light;
        this._extraData = extraData;
        this.Group = group;
    }

    public get Color() {
        return this._extraData & 127;
    }
    public set Color(value: number) {
        this._extraData = (this._extraData & 128) | (value & 127);
    }

    public WithLight(light: number) {
        return new MapTile(this.Type, light, this._extraData | 128, this.Group);
    }

    public static Create(type: number, light: number, color: number, group: number) {
        return new MapTile(type, light, color | 128, group);
    }

    public EqualsWithoutLight(other: MapTile) {
        return !!other && this.Type === other.Type && this.Color === other.Color;
    }
}
