// @ts-nocheck
/* eslint-disable */
/**
 * Generated by the protoc-gen-ts.  DO NOT EDIT!
 * compiler version: 3.19.4
 * source: google/protobuf/any.proto
 * git: https://github.com/thesayyn/protoc-gen-ts */
import * as pb_1 from 'google-protobuf';
export namespace google.protobuf {
	export class Any extends pb_1.Message {
		#one_of_decls = [];
		constructor(
			data?:
				| any[]
				| {
						type_url?: string;
						value?: Uint8Array;
				  }
		) {
			super();
			pb_1.Message.initialize(this, Array.isArray(data) ? data : [], 0, -1, [], this.#one_of_decls);
			if (!Array.isArray(data) && typeof data == 'object') {
				if ('type_url' in data && data.type_url != undefined) {
					this.type_url = data.type_url;
				}
				if ('value' in data && data.value != undefined) {
					this.value = data.value;
				}
			}
		}
		get type_url() {
			return pb_1.Message.getField(this, 1) as string;
		}
		set type_url(value: string) {
			pb_1.Message.setField(this, 1, value);
		}
		get value() {
			return pb_1.Message.getField(this, 2) as Uint8Array;
		}
		set value(value: Uint8Array) {
			pb_1.Message.setField(this, 2, value);
		}
		static fromObject(data: { type_url?: string; value?: Uint8Array }) {
			const message = new Any({});
			if (data.type_url != null) {
				message.type_url = data.type_url;
			}
			if (data.value != null) {
				message.value = data.value;
			}
			return message;
		}
		toObject() {
			const data: {
				type_url?: string;
				value?: Uint8Array;
			} = {};
			if (this.type_url != null) {
				data.type_url = this.type_url;
			}
			if (this.value != null) {
				data.value = this.value;
			}
			return data;
		}
		serialize(): Uint8Array;
		serialize(w: pb_1.BinaryWriter): void;
		serialize(w?: pb_1.BinaryWriter): Uint8Array | void {
			const writer = w || new pb_1.BinaryWriter();
			if (typeof this.type_url === 'string' && this.type_url.length) writer.writeString(1, this.type_url);
			if (this.value !== undefined) writer.writeBytes(2, this.value);
			if (!w) return writer.getResultBuffer();
		}
		static deserialize(bytes: Uint8Array | pb_1.BinaryReader): Any {
			const reader = bytes instanceof pb_1.BinaryReader ? bytes : new pb_1.BinaryReader(bytes),
				message = new Any();
			while (reader.nextField()) {
				if (reader.isEndGroup()) break;
				switch (reader.getFieldNumber()) {
					case 1:
						message.type_url = reader.readString();
						break;
					case 2:
						message.value = reader.readBytes();
						break;
					default:
						reader.skipField();
				}
			}
			return message;
		}
		serializeBinary(): Uint8Array {
			return this.serialize();
		}
		static deserializeBinary(bytes: Uint8Array): Any {
			return Any.deserialize(bytes);
		}
	}
}
