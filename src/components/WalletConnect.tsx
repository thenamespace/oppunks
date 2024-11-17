import { PropsWithChildren } from "react";
import  merge from "lodash.merge";
import {
  getDefaultConfig,
  RainbowKitProvider,
  Theme,
  lightTheme
} from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import {
  mainnet,
  polygon,
  optimism,
  arbitrum,
  base,
} from 'wagmi/chains';
import {
  QueryClientProvider,
  QueryClient,
} from "@tanstack/react-query";


const myTheme = merge(lightTheme(), {
  colors: {
    accentColor: '#1FE5B5',
    modalBackground: 'rgba(0, 0, 0, 0.8)',
    modalBorder: "#1FE5B5",
    modalText: "white",
    modalTextSecondary: "white"
  },
} as Theme);
const config = getDefaultConfig({
    appName: 'OpPunk',
    projectId: 'a5f353014d529c8f85633e3c6250ac28',
    appUrl: "https://oppunk.namespace.ninja",
    chains: [mainnet, polygon, optimism, arbitrum, base],
    ssr: true, // If your dApp uses server side rendering (SSR)
  });

  const queryClient = new QueryClient();

export const WalletConnector = ({children}: PropsWithChildren) => {
   return <WagmiProvider  config={config}>
   <QueryClientProvider client={queryClient}>
     <RainbowKitProvider theme={myTheme}>
       {children}
     </RainbowKitProvider>
   </QueryClientProvider>
 </WagmiProvider>
}