export default class BinaryWriter {
    data: Uint8Array;
    pos: number;
    constructor(size = 1024) {
        this.data = new Uint8Array(size);
        this.pos = 0;
    }

    private checkAlloc(n: number) {
        if (this.pos + n > this.data.length) {
            const newData = new Uint8Array(this.data.length * 2);
            newData.set(this.data);
            this.data = newData;
        }
    }

    WriteString(str: string, writeLength = true) {
        const encoded = new TextEncoder().encode(str);
        if (writeLength) {
            this.WriteByte(encoded.length);
        }

        this.checkAlloc(encoded.length);
        this.data.set(encoded, this.pos);
        this.pos += encoded.length;
    }

    WriteBytes(value: number, n: number) {
        this.checkAlloc(n);

        value <<= (4 - n) * 8;

        for (let i = n - 1; i >= 0; i--) {
            const shift = (4 - n + i) * 8;
            this.data[this.pos + i] = (value & (0xFF << shift)) >> shift;
        }
        this.pos += n;
    }

    WriteByte(byte: number) {
        this.checkAlloc(1);
        this.data[this.pos++] = byte;
    }

    WriteInt16(value: number) {
        this.WriteBytes(value, 2);
    }

    WriteInt32(value: number) {
        this.WriteBytes(value, 4);
    }
}