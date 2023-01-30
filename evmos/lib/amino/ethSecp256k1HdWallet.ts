import {
  Bip39,
  EnglishMnemonic,
  HdPath,
  Random,
  Secp256k1,
  Secp256k1Keypair,
  Slip10,
  Slip10Curve,
  stringToPath,
} from "@cosmjs/crypto";

import { isNonNullObject } from "@cosmjs/utils";
import {
  encodeSecp256k1Signature,
  serializeSignDoc,
  StdSignDoc,
  AccountData,
  AminoSignResponse,
  OfflineAminoSigner,
  KdfConfiguration,
} from "@cosmjs/amino";
import { ethToAstra } from "@astradefi/address-converter";
import { ethers } from "ethers";
import { addressFromPubkey } from "..";
import { fromEthPubkey } from "../pubkey";

interface AccountDataWithPrivkey extends AccountData {
  readonly privkey: Uint8Array;
}

const serializationTypeV1 = "secp256k1wallet-v1";

function extractKdfConfigurationV1(doc: any): KdfConfiguration {
  return doc.kdf;
}

export function extractKdfConfiguration(serialization: string): KdfConfiguration {
  const root = JSON.parse(serialization);
  if (!isNonNullObject(root)) throw new Error("Root document is not an object.");

  switch ((root as any).type) {
    case serializationTypeV1:
      return extractKdfConfigurationV1(root);
    default:
      throw new Error("Unsupported serialization type");
  }
}

/**
 * Derivation information required to derive a keypair and an address from a mnemonic.
 */
interface DerivationInfo {
  readonly hdPath: HdPath;
  /** The bech32 address prefix (human readable part). */
  readonly prefix: string;
}

export interface Secp256k1HdWalletOptions {
  /** The password to use when deriving a BIP39 seed from a mnemonic. */
  readonly bip39Password: string;
  /** The BIP-32/SLIP-10 derivation paths. Defaults to the Cosmos Hub/ATOM path `m/44'/118'/0'/0/0`. */
  readonly hdPaths: readonly HdPath[];
  /** The bech32 address prefix (human readable part). Defaults to "cosmos". */
  readonly prefix: string;
}

interface Secp256k1HdWalletConstructorOptions extends Partial<Secp256k1HdWalletOptions> {
  readonly seed: Uint8Array;
}

const defaultOptions: Secp256k1HdWalletOptions = {
  bip39Password: "",
  hdPaths: [stringToPath("m/44'/60'/0'/0/0")],
  prefix: "astra",
};

export class EthermintSecp256k1HdWallet implements OfflineAminoSigner {
  /**
   * Restores a wallet from the given BIP39 mnemonic.
   *
   * @param mnemonic Any valid English mnemonic.
   * @param options An optional `Secp256k1HdWalletOptions` object optionally containing a bip39Password, hdPaths, and prefix.
   */
  public static async fromMnemonic(
    mnemonic: string,
    options: Partial<Secp256k1HdWalletOptions> = {},
  ): Promise<EthermintSecp256k1HdWallet> {
    const mnemonicChecked = new EnglishMnemonic(mnemonic);
    const seed = await Bip39.mnemonicToSeed(mnemonicChecked, options.bip39Password);
    return new EthermintSecp256k1HdWallet(mnemonicChecked, {
      ...options,
      seed: seed,
    });
  }

  /**
   * Generates a new wallet with a BIP39 mnemonic of the given length.
   *
   * @param length The number of words in the mnemonic (12, 15, 18, 21 or 24).
   * @param options An optional `Secp256k1HdWalletOptions` object optionally containing a bip39Password, hdPaths, and prefix.
   */
  public static async generate(
    length: 12 | 15 | 18 | 21 | 24 = 12,
    options: Partial<Secp256k1HdWalletOptions> = {},
  ): Promise<EthermintSecp256k1HdWallet> {
    const entropyLength = 4 * Math.floor((11 * length) / 33);
    const entropy = Random.getBytes(entropyLength);
    const mnemonic = Bip39.encode(entropy);
    return EthermintSecp256k1HdWallet.fromMnemonic(mnemonic.toString(), options);
  }

  /** Base secret */
  private readonly secret: EnglishMnemonic;
  /** BIP39 seed */
  private readonly seed: Uint8Array;
  /** Derivation instruction */
  private readonly accounts: readonly DerivationInfo[];

  protected constructor(mnemonic: EnglishMnemonic, options: Secp256k1HdWalletConstructorOptions) {
    const hdPaths = options.hdPaths ?? defaultOptions.hdPaths;
    const prefix = options.prefix ?? defaultOptions.prefix;
    this.secret = mnemonic;
    this.seed = options.seed;
    this.accounts = hdPaths.map((hdPath) => ({
      hdPath: hdPath,
      prefix,
    }));
  }

  public get mnemonic(): string {
    return this.secret.toString();
  }

  public get address(): string {
    const ethWallet = ethers.Wallet.fromMnemonic(this.mnemonic);
    return ethToAstra(ethWallet.address);
  }

  public get pubkey(): Uint8Array {
    const ethWallet = ethers.Wallet.fromMnemonic(this.mnemonic);
    return fromEthPubkey(ethWallet.publicKey);
  }

  public async getAccounts(): Promise<readonly AccountData[]> {
    const accountsWithPrivkeys = await this.getAccountsWithPrivkeys();
    return accountsWithPrivkeys.map(({ algo, pubkey, address }) => ({
      algo: algo,
      pubkey: pubkey,
      address: address,
    }));
  }

  public async signAmino(signerAddress: string, signDoc: StdSignDoc): Promise<AminoSignResponse> {
    const accounts = await this.getAccountsWithPrivkeys();
    const account = accounts.find(({ address }) => address === signerAddress);
    if (account === undefined) {
      throw new Error(`Address ${signerAddress} not found in wallet`);
    }
    const { privkey, pubkey } = account;

    const message = ethers.utils.keccak256(serializeSignDoc(signDoc));

    const signature = await Secp256k1.createSignature(ethers.utils.arrayify(message), privkey);

    const signatureBytes = new Uint8Array([
      ...Array.from(signature.r(32)),
      ...Array.from(signature.s(32)),
    ]);

    return {
      signed: signDoc,
      signature: encodeSecp256k1Signature(pubkey, signatureBytes),
    };
  }

  private async getKeyPair(hdPath: HdPath): Promise<Secp256k1Keypair> {
    const { privkey } = Slip10.derivePath(Slip10Curve.Secp256k1, this.seed, hdPath);
    const { pubkey } = await Secp256k1.makeKeypair(privkey);
    return {
      privkey: privkey,
      pubkey: Secp256k1.compressPubkey(pubkey),
    };
  }

  private async getAccountsWithPrivkeys(): Promise<readonly AccountDataWithPrivkey[]> {
    return Promise.all(
      this.accounts.map(async ({ hdPath, prefix }) => {
        const { privkey, pubkey } = await this.getKeyPair(hdPath);

        const address = addressFromPubkey(pubkey);

        return {
          algo: "secp256k1" as const,
          privkey: privkey,
          pubkey: pubkey,
          address: address,
        };
      }),
    );
  }
}
