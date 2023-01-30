import { sha256 } from "@cosmjs/crypto";
import { fromBase64, toBech32, fromBech32 } from "@cosmjs/encoding";

import {
  isEd25519Pubkey,
  isMultisigThresholdPubkey,
  isSecp256k1Pubkey,
  Pubkey,
  rawEd25519PubkeyToRawAddress,
  rawSecp256k1PubkeyToRawAddress,
} from "@cosmjs/amino";

import { importPublic, Address } from "@ethereumjs/util";
import { ethToAstra } from "@astradefi/address-converter";
import { isEthSecp256k1Pubkey } from "../pubkey";
import { encodeAminoPubkey } from "./encoding";

export const addressFromBase64Pubkey = (base64Pubkey: string) => {
  if (base64Pubkey.length !== 44) {
    throw new Error("Public key must be secp256k1 key in base64");
  }
  const pubkey = fromBase64(base64Pubkey);
  if (pubkey.length !== 33 || (pubkey[0] !== 0x02 && pubkey[0] !== 0x03)) {
    throw new Error("Public key must be secp256k1 key in base64");
  }

  return addressFromPubkey(pubkey);
};

export const addressFromPubkey = (pubkey: Uint8Array): string => {
  const ethPubkey = importPublic(Buffer.from(pubkey));
  const ethAddress = Address.fromPublicKey(ethPubkey).toString();
  return ethToAstra(ethAddress.toString());
};

export const addressFromPrivkey = (privkey: Uint8Array): string => {
  const ethAddress = Address.fromPrivateKey(Buffer.from(privkey));
  return ethToAstra(ethAddress.toString());
};

export const rawEthSecp256k1PubkeyToRawAddress = (pubkeyData: Uint8Array): Uint8Array => {
  if (pubkeyData.length !== 33) {
    throw new Error(`Invalid Secp256k1 pubkey length (compressed): ${pubkeyData.length}`);
  }
  const ethPubkey = importPublic(Buffer.from(pubkeyData));
  const ethAddress = Address.fromPublicKey(ethPubkey);
  return ethAddress.toBuffer();
};

// For secp256k1 this assumes we already have a compressed pubkey.
export function pubkeyToRawAddress(pubkey: Pubkey): Uint8Array {
  if (isEthSecp256k1Pubkey(pubkey)) {
    const pubkeyData = fromBase64(pubkey.value);
    return rawEthSecp256k1PubkeyToRawAddress(pubkeyData);
  } else if (isSecp256k1Pubkey(pubkey)) {
    const pubkeyData = fromBase64(pubkey.value);
    return rawSecp256k1PubkeyToRawAddress(pubkeyData);
  } else if (isEd25519Pubkey(pubkey)) {
    const pubkeyData = fromBase64(pubkey.value);
    return rawEd25519PubkeyToRawAddress(pubkeyData);
  } else if (isMultisigThresholdPubkey(pubkey)) {
    // https://github.com/tendermint/tendermint/blob/38b401657e4ad7a7eeb3c30a3cbf512037df3740/crypto/multisig/threshold_pubkey.go#L71-L74
    const pubkeyData = encodeAminoPubkey(pubkey);
    return sha256(pubkeyData).slice(0, 20);
  } else {
    throw new Error("Unsupported public key type");
  }
}

export function pubkeyToAddress(pubkey: Pubkey, prefix = "astra"): string {
  return toBech32(prefix, pubkeyToRawAddress(pubkey));
}

export function isAstraAddress(address: string): boolean {
  return isValidAddress(address, "astra");
}

export function isValidAddress(input: string, requiredPrefix: string): boolean {
  try {
    const { prefix, data } = fromBech32(input);
    if (prefix !== requiredPrefix) {
      return false;
    }
    return data.length === 20;
  } catch {
    return false;
  }
}
