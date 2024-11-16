import { TechContainerBg } from "@components/components/TechContainerBg";
import { WalletConnector } from "@components/components/WalletConnect";
import "@components/styles/globals.scss";
import type { AppProps } from "next/app";

export default function App({ Component, pageProps }: AppProps) {
  return <WalletConnector>
    <TechContainerBg>
    <Component {...pageProps} />;      
    </TechContainerBg>
  </WalletConnector>
}
