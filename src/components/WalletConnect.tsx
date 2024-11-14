import { PropsWithChildren } from "react";

import {
  getDefaultConfig,
  RainbowKitProvider,
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

const config = getDefaultConfig({
    appName: 'My RainbowKit App',
    projectId: 'YOUR_PROJECT_ID',
    chains: [mainnet, polygon, optimism, arbitrum, base],
    ssr: true, // If your dApp uses server side rendering (SSR)
  });

  const queryClient = new QueryClient();

export const WalletConnector = ({children}: PropsWithChildren) => {
   return <WagmiProvider config={config}>
   <QueryClientProvider client={queryClient}>
     <RainbowKitProvider>
       {children}
     </RainbowKitProvider>
   </QueryClientProvider>
 </WagmiProvider>
}