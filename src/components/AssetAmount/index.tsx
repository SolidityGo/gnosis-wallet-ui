import { CurrencyValue } from '@usedapp/core';
import React from 'react';
import { Token } from '@usedapp/core';
import { ethers } from 'ethers';

export interface TokenWithAmount {
  token: Token;
  amount: ethers.BigNumber;
}

export function displayAmount(asset: Partial<TokenWithAmount> = {}) {
  const { token, amount } = asset;
  if (!token) return '-';
  if (!amount) return 0 + ' ' + token.ticker;
  return new CurrencyValue(token, amount).format({
    suffix: ' ' + token.ticker,
  });
}

export const AssetAmount: React.FC<{ asset: undefined | Partial<TokenWithAmount> }> = (props) => {
  return <>{displayAmount(props.asset)}</>;
};
