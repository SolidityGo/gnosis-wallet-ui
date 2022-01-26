import * as SelectedConfig from './mainnet';

interface PredefinedConfig {
  NETWORK_CONFIG: {
    chainId: number;
    chainName: string;
    rpcUrls: string[];
    nativeCurrency: {
      name: string;
      symbol: string;
      decimals: number;
    };
    blockExplorerUrls: string[];
  };

  /**
   * @deprecated
   */
  HC_NFT_ADDRESS: string;
}

export const Configs: PredefinedConfig = SelectedConfig;
