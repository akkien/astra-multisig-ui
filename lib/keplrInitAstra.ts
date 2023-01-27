export const initAstraChain = async (window: any) => {
  if (!window?.keplr) {
    return;
  }

  await window.keplr.experimentalSuggestChain({
    chainId: "astra_11115-1",
    chainName: "astra testnet",
    rpc: "http://159.89.202.43:26657",
    rest: "http://159.89.202.43:1317",
    bip44: {
      coinType: 60,
    },
    bech32Config: {
      bech32PrefixAccAddr: "astra",
      bech32PrefixAccPub: "astra" + "pub",
      bech32PrefixValAddr: "astra" + "valoper",
      bech32PrefixValPub: "astra" + "valoperpub",
      bech32PrefixConsAddr: "astra" + "valcons",
      bech32PrefixConsPub: "astra" + "valconspub",
    },
    currencies: [
      {
        coinDenom: "ASTRA",
        coinMinimalDenom: "aastra",
        coinDecimals: 18,
        coinGeckoId: "astra",
      },
    ],
    feeCurrencies: [
      {
        coinDenom: "ASTRA",
        coinMinimalDenom: "aastra",
        coinDecimals: 18,
        coinGeckoId: "astra",
        gasPriceStep: {
          low: 0.01,
          average: 0.025,
          high: 0.04,
        },
      },
    ],
    stakeCurrency: {
      coinDenom: "ASTRA",
      coinMinimalDenom: "aastra",
      coinDecimals: 18,
    },
    features: ["eth-address-gen", "eth-key-sign"],
  });
};
