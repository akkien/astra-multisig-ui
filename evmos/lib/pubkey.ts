import { toBase64 } from "@cosmjs/encoding";
import { SinglePubkey } from "@cosmjs/amino";
import { Point } from "ethereum-cryptography/secp256k1";
import { isAstraAddress, addressFromBase64Pubkey } from "./amino";

const assertPubkey = (pubkey: Uint8Array) => {
  return false;
};

export interface EthermintSecp256k1Pubkey extends SinglePubkey {
  readonly type: "/ethermint.crypto.v1.ethsecp256k1.PubKey";
  readonly value: string;
}

export function isEthSecp256k1Pubkey(pubkey: SinglePubkey) {
  return pubkey.type === "/ethermint.crypto.v1.ethsecp256k1.PubKey";
}

export function ethSecp256k1PubkeyFromBase64(pubkey: string): EthermintSecp256k1Pubkey {
  if (pubkey.length !== 44) {
    throw new Error("Public key must be secp256k1 key in base64");
  }
  return {
    type: "/ethermint.crypto.v1.ethsecp256k1.PubKey",
    value: pubkey,
  };
}

export function ethSecp256k1PubkeyFromBuffer(pubkey: Uint8Array): EthermintSecp256k1Pubkey {
  if (pubkey.length !== 33 || (pubkey[0] !== 0x02 && pubkey[0] !== 0x03)) {
    throw new Error(
      "Public key must be compressed secp256k1, i.e. 33 bytes starting with 0x02 or 0x03",
    );
  }
  return {
    type: "/ethermint.crypto.v1.ethsecp256k1.PubKey",
    value: toBase64(pubkey),
  };
}

// TODO: assert length,...
export function fromEthPubkey(ethPubkey: string): Uint8Array {
  return Point.fromHex(ethPubkey.slice(2)).toRawBytes(true);
}

export function isValidAstraPubkey(base64Pubkey: string): boolean {
  try {
    const address = addressFromBase64Pubkey(base64Pubkey);
    return isAstraAddress(address);
  } catch {
    return false;
  }
}
