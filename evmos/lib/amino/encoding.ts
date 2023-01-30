import { toBase64 } from "@cosmjs/encoding";
import { fromHex, fromBase64, toBech32 } from "@cosmjs/encoding";
import {
  isEd25519Pubkey,
  isMultisigThresholdPubkey,
  isSecp256k1Pubkey,
  Pubkey,
} from "@cosmjs/amino";
import { Uint53 } from "@cosmjs/math";
import { isEthSecp256k1Pubkey } from "../pubkey";
import { pubkeyType, EthSecp256k1Pubkey } from "./pubkeys";

/**
 * Takes a Secp256k1 public key as raw bytes and returns the Amino JSON
 * representation of it (the type/value wrapper object).
 */
export function encodeEthSecp256k1Pubkey(pubkey: Uint8Array): EthSecp256k1Pubkey {
  if (pubkey.length !== 33 || (pubkey[0] !== 0x02 && pubkey[0] !== 0x03)) {
    throw new Error(
      "Public key must be compressed secp256k1, i.e. 33 bytes starting with 0x02 or 0x03",
    );
  }
  return {
    type: pubkeyType.ethSecp256k1,
    value: toBase64(pubkey),
  };
}

const hashOfEthSecp256k1PubkeyType = ""; // f3b3cd03
const pubkeyAminoPrefixEthSecp256k1 = fromHex(
  hashOfEthSecp256k1PubkeyType + "21" /* fixed length */,
);
// sha256(Buffer.from("tendermint/PubKeySecp256k1")).slice(8, 16);
const pubkeyAminoPrefixSecp256k1 = fromHex("eb5ae987" + "21" /* fixed length */);
const pubkeyAminoPrefixEd25519 = fromHex("1624de64" + "20" /* fixed length */);
const pubkeyAminoPrefixSr25519 = fromHex("0dfb1005" + "20" /* fixed length */);
/** See https://github.com/tendermint/tendermint/commit/38b401657e4ad7a7eeb3c30a3cbf512037df3740 */
const pubkeyAminoPrefixMultisigThreshold = fromHex("22c1f7e2" /* variable length not included */);

/**
 * Uvarint encoder for Amino. This is the same encoding as `binary.PutUvarint` from the Go
 * standard library.
 *
 * @see https://github.com/tendermint/go-amino/blob/8e779b71f40d175/encoder.go#L77-L85
 */
function encodeUvarint(value: number | string): number[] {
  const checked = Uint53.fromString(value.toString()).toNumber();
  if (checked > 127) {
    throw new Error(
      "Encoding numbers > 127 is not supported here. Please tell those lazy CosmJS maintainers to port the binary.PutUvarint implementation from the Go standard library and write some tests.",
    );
  }
  return [checked];
}

/**
 * Encodes a public key to binary Amino.
 */
export function encodeAminoPubkey(pubkey: Pubkey): Uint8Array {
  if (isMultisigThresholdPubkey(pubkey)) {
    const out = Array.from(pubkeyAminoPrefixMultisigThreshold);

    out.push(0x08); // TODO: What is this?

    out.push(...encodeUvarint(pubkey.value.threshold));
    for (const pubkeyData of pubkey.value.pubkeys.map((p) => encodeAminoPubkey(p))) {
      out.push(0x12); // TODO: What is this?

      out.push(...encodeUvarint(pubkeyData.length));
      out.push(...Array.from(pubkeyData));
    }
    return new Uint8Array(out);
  } else if (isEd25519Pubkey(pubkey)) {
    return new Uint8Array([
      ...Array.from(pubkeyAminoPrefixEd25519),
      ...Array.from(fromBase64(pubkey.value)),
    ]);
  } else if (isSecp256k1Pubkey(pubkey)) {
    return new Uint8Array([
      ...Array.from(pubkeyAminoPrefixSecp256k1),
      ...Array.from(fromBase64(pubkey.value)),
    ]);
  } else if (isEthSecp256k1Pubkey(pubkey)) {
    return new Uint8Array([
      ...Array.from(pubkeyAminoPrefixEthSecp256k1),
      ...Array.from(fromBase64(pubkey.value)),
    ]);
  } else {
    throw new Error("Unsupported pubkey type");
  }
}

/**
 * Encodes a public key to binary Amino and then to bech32.
 *
 * @param pubkey the public key to encode
 * @param prefix the bech32 prefix (human readable part)
 */
export function encodeBech32Pubkey(pubkey: Pubkey, prefix: string): string {
  return toBech32(prefix, encodeAminoPubkey(pubkey));
}
