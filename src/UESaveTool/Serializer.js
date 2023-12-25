
export class Serializer {
    constructor(buf) {
        this._data = buf;
        this._offset = 0;
    }
    get Data() { return this._data }
    get tell() { return this._offset }
    seek(count) {
        if(this._offset >= this._data.length)
            throw new Error(`Reached end of Buffer at offset 0x${this.tell.toString(16)}`);
        return this._offset += count;
    }
    read(count) {
        return this.Data.slice(this.tell, this.seek(count));
    }
    readInt32() {
        let int = this.Data.readInt32LE(this.tell);
        this.seek(4);
        return int;
    }
    readUInt32() {
        let int = this.Data.readUInt32LE(this.tell);
        this.seek(4);
        return int;
    }
    readInt64() {
        let int1 = this.Data.readInt32LE(this.tell);
        this.seek(4);
        let int2 = this.Data.readInt32LE(this.tell);
        this.seek(4);
        // return (BigInt(int2) << BigInt(32)) + BigInt(int1);
        return int1; // TODO: Day Number won't exceed 4294967296; but...
    }
    readInt16() {
        let int = this.Data.readInt16LE(this.tell);
        this.seek(2)
        return int;
    }
    readUInt16() {
        let int = this.Data.readUInt16LE(this.tell);
        this.seek(2);
        return int;
    }
    readInt8() {
        let int = this.Data.readInt8(this.tell);
        this.seek(1);
        return int;
    }
    readUInt8() {
        let int = this.Data.readUInt8(this.tell);
        this.seek(1);
        return int;
    }
    readFloat() {
        let float = this.Data.readFloatLE(this.tell);
        this.seek(4);
        return float;
    }
    readString() {
        let length = this.readInt32();
        let str = this.read(length - 1).toString('utf8');
        this.read(1);
        return str;
    }
    readUnicodeString() {
        let length = this.readInt32();
        if (length < 0) {
            let str = this.read(-length * 2 - 2).toString('utf16le');
            this.read(2);
            return [str, "utf16le"];
        } else {
            let str = this.read(length - 1).toString('utf8');
            this.read(1);
            return [str, "utf8"];
        }
    }
    write(buf) {
        this._offset += buf.copy(this.Data, this.tell);
    }
    writeInt64(num) {
        this._offset = this.Data.writeInt32LE(num, this.tell);
        this._offset = this.Data.writeInt32LE(0, this.tell);
        // TODO: this._offset = this.Data.writeBigInt64LE(num, this.tell);
    }
    writeUInt32(num) {
        this._offset = this.Data.writeUInt32LE(num, this.tell);
    }
    writeInt32(num) {
        this._offset = this.Data.writeInt32LE(num, this.tell);
    }
    writeUInt16(num) {
        this._offset = this.Data.writeUInt16LE(num, this.tell);
    }
    writeInt16(num) {
        this._offset = this.Data.writeInt16LE(num, this.tell);
    }
    writeUInt8(byte) {
        this._offset = this.Data.writeUInt8(byte, this.tell);
    }
    writeInt8(byte) {
        this._offset = this.Data.writeInt8(byte, this.tell);
    }
    writeFloat(num) {
        this._offset = this.Data.writeFloatLE(num, this.tell);
    }
    writeString(str) {
        this._offset = this.Data.writeInt32LE(str.length + 1, this.tell);
        this._offset += this.Data.write(str, this.tell);
        this._offset = this.Data.writeInt8(0, this.tell);
    }
    writeUTF16String(str) {
        this._offset = this.Data.writeInt32LE(-str.length - 1, this.tell);
        this._offset += this.Data.write(str + "\0", this.tell, "utf16le");
    }
    writeUTF8String(str) {
        this._offset = this.Data.writeInt32LE(str.length + 1, this.tell);
        this._offset += this.Data.write(str + "\0", this.tell, "utf8");
    }
    append(buf) {
        this._data = Buffer.concat([this.Data, buf]);
        this._offset += buf.length;
    }
    static alloc(size) {
        return new Serializer(Buffer.alloc(size));
    }
}