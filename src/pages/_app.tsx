import { WalletConnector } from "@components/components/WalletConnect";
import "@components/styles/globals.scss";
import type { AppProps } from "next/app";

export default function App({ Component, pageProps }: AppProps) {
  return <WalletConnector>
    <Component {...pageProps} />;
  </WalletConnector>
}
