import React, { useEffect } from "react";
import { AppWrapper } from "../context/AppContext";
import ChainSelect from "../components/chainSelect/ChainSelect";
import type { AppProps } from "next/app";
import { initAstraChain } from "../lib/keplrInitAstra";
function MultisigApp({ Component, pageProps }: AppProps) {
  const showChainSelect = process.env.NEXT_PUBLIC_MULTICHAIN?.toLowerCase() === "true";

  useEffect(() => {
    initAstraChain(window);
  }, []);

  return (
    <AppWrapper>
      {showChainSelect && <ChainSelect />}
      <Component {...pageProps} />
    </AppWrapper>
  );
}
export default MultisigApp;
