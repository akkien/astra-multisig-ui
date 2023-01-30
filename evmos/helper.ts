import { coin, SignerData, StargateClient, StdFee } from "@cosmjs/stargate";
import { ethers } from "ethers";
import {
  createMultisigThresholdPubkey,
  EthermintSecp256k1HdWallet,
  EthermintSigningClient,
  ethSecp256k1PubkeyFromBase64,
  ethSecp256k1PubkeyFromBuffer,
  pubkeyToAddress,
  addressFromPubkey,
} from "./lib";

import { COSMOS_RPC, clientOptions } from "./config";
import { makeMultisignedTxBytes } from "./lib";
import { EncodeObject } from "@cosmjs/proto-signing";
import { toBase64, fromBase64 } from "@cosmjs/encoding";
import { SignatureV2 } from "./types";

// TODO: fee do not auto match with Keplr for now
const defaultFee = {
  amount: [coin("5000", "aastra")],
  gas: "200000",
};

export const getBalancesStatus = async (
  partA: string,
  partB: string,
  multiSig: string,
  denom: string,
) => {
  const client = await StargateClient.connect(COSMOS_RPC, clientOptions);
  const rest = await Promise.all([
    client.getBalance(partA, denom),
    client.getBalance(partB, denom),
    client.getBalance(multiSig, denom),
  ]);
  return {
    alice: rest[0],
    bob: rest[1],
    channel: rest[2],
  };
};

export const getMultisigAddressFromUint8Pubkey = (
  uint8arrayPubkey1: Uint8Array,
  uint8arrayPubkey2: Uint8Array,
) => {
  const multisigPubkey = createMultisigThresholdPubkey(
    [
      ethSecp256k1PubkeyFromBuffer(uint8arrayPubkey1),
      ethSecp256k1PubkeyFromBuffer(uint8arrayPubkey2),
    ],
    2,
  );

  return pubkeyToAddress(multisigPubkey);
};

export const getMultisigAddressFromBase64Pubkey = (base64Pubkeys: string[], threshold: number) => {
  const multisigPubkey = createMultisigThresholdPubkey(
    base64Pubkeys.map((item) => ethSecp256k1PubkeyFromBase64(item)),
    threshold,
  );

  return pubkeyToAddress(multisigPubkey);
};

export const getChannelId = (multisig: string, denom: string, sequence: number) => {
  return `${multisig}:${denom}:${sequence}`;
};

export const getCommitmentIndex = (multisig: string, secret: string) => {
  return multisig + ":" + getHashCode(secret);
};

export const getHashCode = (input: string): string => {
  const etherHash = ethers.utils.sha256("0x" + Buffer.from(input).toString("hex"));
  return ethers.utils.base64.encode(etherHash);
};

export const signSingleAndSend = async (
  wallet: EthermintSecp256k1HdWallet,
  signerAddress: string,
  msg: any,
) => {
  const client = await EthermintSigningClient.connectWithSigner(COSMOS_RPC, wallet, clientOptions);

  const result = await client.signAndBroadcast(signerAddress, [msg], defaultFee, "");

  return result;
};

export const combineMultisigAndSend = async (
  client: StargateClient,
  fromPubkey: Uint8Array,
  fromSig: string,
  toPubkey: Uint8Array,
  toSig: string,
  txBody: Uint8Array,
  fee: StdFee = defaultFee,
) => {
  const multisigPubkey = createMultisigThresholdPubkey(
    [ethSecp256k1PubkeyFromBuffer(fromPubkey), ethSecp256k1PubkeyFromBuffer(toPubkey)],
    2,
  );
  const multisig = pubkeyToAddress(multisigPubkey);

  const accountOnChain = await client.getAccount(multisig);
  if (!accountOnChain) {
    throw Error("Multisig not found on chain");
  }

  const signedTx = makeMultisignedTxBytes(
    multisigPubkey,
    accountOnChain.sequence,
    fee,
    txBody,
    new Map<string, Uint8Array>([
      [addressFromPubkey(fromPubkey), fromBase64(fromSig)],
      [addressFromPubkey(toPubkey), fromBase64(toSig)],
    ]),
  );

  const result = await client.broadcastTx(signedTx);

  return result;
};

export const signMultisigMsg = async (
  signerAddress: string,
  signerPubkey: Uint8Array,
  signingClient: EthermintSigningClient,
  multiSigAddress: string,
  msgs: EncodeObject[],
  chainId: string,
  fee: StdFee = defaultFee,
  memo = "",
) => {
  const pubkey = ethSecp256k1PubkeyFromBuffer(signerPubkey);

  const multisigOnChain = await signingClient.getAccount(multiSigAddress);
  if (!multisigOnChain) {
    throw Error("Multisig not found");
  }

  const signerData: SignerData = {
    accountNumber: multisigOnChain.accountNumber,
    sequence: multisigOnChain.sequence,
    chainId: chainId,
  };
  const { bodyBytes, signatures } = await signingClient.sign(
    signerAddress,
    msgs,
    fee,
    memo,
    signerData,
  );

  const signatureV2: SignatureV2 = {
    public_key: {
      "@type": pubkey.type,
      key: pubkey.value,
    },
    data: {
      single: {
        mode: "SIGN_MODE_LEGACY_AMINO_JSON", // TODO: hardcode for now
        signature: toBase64(signatures[0]),
      },
    },
    sequence: multisigOnChain.sequence.toString(),
  };

  console.log("signatureV2", signatureV2);
  console.log("msgs", msgs);

  return [
    pubkey,
    JSON.stringify({
      signatures: [signatureV2],
    }),
    bodyBytes,
  ] as const;
};
