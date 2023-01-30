export interface SignatureV2 {
  public_key: any;
  data: {
    single: {
      mode: string;
      signature: string;
    };
  };
  sequence: string;
}
