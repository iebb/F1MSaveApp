import {SerializationError} from "../PropertyErrors";
import {Serializer} from '../Serializer';
import {Property} from './'

export class StrProperty extends Property {
    constructor() {
        super();
        this.Property = "";
        this.Encoding = "utf8";
    }

    get StringEncodedLength() {
        return Buffer.from(this.Property + "\0", this.Encoding).length;
    }

    get Size() {
        const baseLength = this.Name.length + 1 + 4 + this.Type.length + 1 + 4;
        return baseLength + this.StringEncodedLength + 4 + 9;
    }
    deserialize(serial) {
        serial.seek(5);
        [this.Property, this.Encoding] = serial.readUnicodeString();
        return this;
    }
    serialize() {
        let serial = Serializer.alloc(this.Size);
        serial.writeString(this.Name);
        serial.writeString(this.Type);

        serial.writeInt32(this.StringEncodedLength + 4);
        serial.seek(5);
        switch (this.Encoding) {
            case "utf8":
                serial.writeUTF8String(this.Property);
                break;
            case "utf16le":
                serial.writeUTF16String(this.Property);
                break;
        }
        if (serial.tell !== this.Size)
            throw new SerializationError(this);
        return serial.Data;
    }
    static from(obj) {
        let prop = new StrProperty();
        Object.assign(prop, obj);
        return prop;
    }
}
