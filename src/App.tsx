import Homepage from "./components/dashboard/HomePage";
import { DynamicContextProvider } from "@dynamic-labs/sdk-react-core";
import { EthereumWalletConnectors } from "@dynamic-labs/ethereum";
import { base, arbitrum } from "viem/chains";
import { Provider } from "react-redux";
import store from "./store/index";



function App() {
  const dynamicSettings = {
    environmentId: "3f6134d4-3d91-4d31-879e-aa828e2e3b3f",
    walletConnectors: [EthereumWalletConnectors],
    enableEnsLookup: true,
    evmNetworks: [
      {
        chainId: base.id,
        chainName: "Base",
        networkId: base.id,
        nativeCurrency: {
          name: "Ethereum",
          symbol: "ETH",
          decimals: 18,
        },
        rpcUrls: [base.rpcUrls.default.http[0]],
        blockExplorerUrls: [base.blockExplorers.default.url],
      },
      {
        chainId: arbitrum.id,
        chainName: "Arbitrum",
        networkId: arbitrum.id,
        nativeCurrency: {
          name: "Ethereum",
          symbol: "ETH",
          decimals: 18,
        },
        rpcUrls: [arbitrum.rpcUrls.default.http[0]],
        blockExplorerUrls: [arbitrum.blockExplorers.default.url],
      },
    ],
    defaultNetwork: base.id,
    cssOverride: {
      colors: {
        primary: "#3B82F6",
        secondary: "#1D4ED8",
      },
    },
  };

  return (
    <Provider store={store}>
      <DynamicContextProvider settings={dynamicSettings}>
        <Homepage />
      </DynamicContextProvider>
    </Provider>
  );
}

export default App;
