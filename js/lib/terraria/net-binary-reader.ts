export default class BinaryReader {
    data: Uint8Array;
    pos: number;

    constructor(data: (Uint8Array | ArrayBuffer), pos = 0) {
        if (data instanceof Uint8Array) {
            this.data = data;
        } else {
            this.data = new Uint8Array(data);
        }
        
        this.pos = pos;
    }

    ReadString(n?: number): string {
        if (!n) {
            n = this.ReadByte();
        }
        const start = this.pos;
        const end = this.pos + n;

        if (end > this.data.length) {
            throw RangeError("Reached end of file");
        }
        const result = new TextDecoder("utf-8").decode(this.data.slice(start, end));
        this.pos = end;
        return result;
    }

    ReadBytes(n: number, signed: boolean): number {
        let value = 0;

        if (this.pos + n > this.data.length) {
            throw RangeError("Reached end of file");
        }
        for (let i = n - 1; i >= 0; i--) {
            value |= this.data[this.pos + i] << (i * 8);
        }
        this.pos += n;
        if (signed) {
            value = (value << (4 - n) * 8) >> (4 - n) * 8;
        }
        return value;
    }

    ReadBigBytes(n: number): bigint {
        let value = 0n;

        if (this.pos + n > this.data.length) {
            throw RangeError("Reached end of file");
        }
        for (let i = n - 1; i >= 0; i--) {
            value |= BigInt(this.data[this.pos + i]) << BigInt(i * 8);
        }
        this.pos += n;

        return value;
    }

    ReadBoolean(): boolean {
        return this.ReadByte() !== 0;
    }

    ReadByte(): number {
        if (this.pos >= this.data.length) {
            throw RangeError("Reached end of file");
        }
        return this.data[this.pos++];
    }

    ReadInt16(): number {
        return this.ReadBytes(2, true);
    }

    ReadUInt16(): number {
        return this.ReadBytes(2, false);
    }

    ReadInt32(): number {
        // shifting unneccessary for 32-bit cause already hit js's bitwise op size limit
        return this.ReadBytes(4, false);
    }

    ReadUInt32(): bigint {
        return this.ReadBigBytes(4);
    }

    ReadUInt64(): bigint {
        return this.ReadBigBytes(8);
    }

    ReadBitArray(n?: number): boolean[] {
        if (!n) {
            n = this.ReadInt16();
        }
        const arr: boolean[] = Array(n);
        let byte = 0;
        let mask = 128;
        for (let i = 0; i < n; ++i) {
            if (mask == 128) {
                byte = this.ReadByte();
                mask = 1;
            } else {
                mask <<= 1;
            }
            if ((byte & mask) === mask) arr[i] = true;
        }
        return arr;
    }
}