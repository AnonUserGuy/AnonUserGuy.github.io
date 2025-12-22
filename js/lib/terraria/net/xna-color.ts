export default class Color {
    R: number;
    G: number;
    B: number;
    A: number;
    constructor(r: number, g: number, b: number, a = 255) {
        this.R = r;
        this.G = g;
        this.B = b;
        this.A = a;
    }

    public toString() {
        return `rgb(${this.R} ${this.G} ${this.B})`;
    }

    public copy() {
        return new Color(this.R, this.G, this.B, this.A);
    }

    static get Black() { return new Color(0, 0, 0) };
    static get White() { return new Color(255, 255, 255) };
    static get Transparent() { return new Color(0, 0, 0, 0) };

    static readonly globalBlack = Color.Black;
}