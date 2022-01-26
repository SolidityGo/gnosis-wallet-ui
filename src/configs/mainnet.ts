import { ChainId } from '@usedapp/core';

/**
 * @deprecated
 */
export const HC_NFT_ADDRESS: string = '0x1234567890123456789012345678901234567890';

export const NETWORK_CONFIG = {
  chainId: ChainId.BSC,
  chainName: 'Binance Smart Chain',
  rpcUrls: ['https://bsc-dataseed1.binance.org'],
  nativeCurrency: {
    name: 'BINANCE COIN',
    symbol: 'BNB',
    decimals: 18,
  },
  blockExplorerUrls: ['https://bscscan.com/'],
};
