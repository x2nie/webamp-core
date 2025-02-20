export default class MakiWriter {
    private buffer: Uint8Array;
    private view: DataView;
    private offset: number;

    constructor(size: number = 1024) {
        this.buffer = new Uint8Array(size);
        this.view = new DataView(this.buffer.buffer);
        this.offset = 0;
    }

    private ensureCapacity(additionalSize: number) {
        if (this.offset + additionalSize > this.buffer.length) {
            const newSize = Math.max(this.buffer.length * 2, this.offset + additionalSize);
            const newBuffer = new Uint8Array(newSize);
            newBuffer.set(this.buffer);
            this.buffer = newBuffer;
            this.view = new DataView(this.buffer.buffer);
        }
    }

    writeUint8(value: number) {
        this.ensureCapacity(1);
        this.view.setUint8(this.offset, value);
        this.offset += 1;
    }

    writeUint16(value: number) {
        this.ensureCapacity(2);
        this.view.setUint16(this.offset, value, false); // Big-endian
        this.offset += 2;
    }

    writeUint16LE(value: number) {
        this.ensureCapacity(2);
        this.view.setUint16(this.offset, value, true); // Little-endian
        this.offset += 2;
    }

    writeInt32(value: number) {
        this.ensureCapacity(4);
        this.view.setInt32(this.offset, value, false); // Big-endian
        this.offset += 4;
    }

    writeInt32LE(value: number) {
        this.ensureCapacity(4);
        this.view.setInt32(this.offset, value, true); // Little-endian
        this.offset += 4;
    }

    writeUint32LE(value: number) {
        this.ensureCapacity(4);
        this.view.setUint32(this.offset, value, true); // Little-endian
        this.offset += 4;
    }

    writePascalString(s: string) {
        const bytes = new TextEncoder().encode(s);
        this.ensureCapacity(2 + bytes.length);
        // this.view.setUint8(this.offset, bytes.length);
        this.view.setUint16(this.offset, bytes.length, true); // Little-endian
        this.offset += 2;
        this.buffer.set(bytes, this.offset);
        this.offset += bytes.length;
    }

    writeGUID(guid: string) {
        const hex = guid.replace(/-/g, ""); // Hapus tanda '-'
        if (hex.length !== 32) {
            throw new Error("Invalid GUID format");
        }

        const bytes = new Uint8Array(16);

        // Bagian yang perlu di-reverse (little-endian)
        bytes[0] = parseInt(hex.slice(6, 8), 16);
        bytes[1] = parseInt(hex.slice(4, 6), 16);
        bytes[2] = parseInt(hex.slice(2, 4), 16);
        bytes[3] = parseInt(hex.slice(0, 2), 16);

        bytes[4] = parseInt(hex.slice(10, 12), 16);
        bytes[5] = parseInt(hex.slice(8, 10), 16);

        bytes[6] = parseInt(hex.slice(14, 16), 16);
        bytes[7] = parseInt(hex.slice(12, 14), 16);

        // Sisanya tetap big-endian
        for (let i = 8; i < 16; i++) {
            bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
        }

        this.ensureCapacity(16);
        this.buffer.set(bytes, this.offset);
        this.offset += 16;
    }


    getData(): Uint8Array {
        return this.buffer.slice(0, this.offset);
    }

    download(filename: string = "data.bin") {
        const blob = new Blob([this.getData()], { type: "application/octet-stream" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
}

//? Contoh penggunaan
/*
const writer = new BinaryWriter();
writer.writeInt32(42);
writer.writeInt32LE(1000);
writer.writeUint8(255);
writer.writePascalString("Hello");
writer.download("output.bin");
*/