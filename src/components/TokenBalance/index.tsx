import React from 'react';
import { Token, useEthers, useTokenBalance } from '@usedapp/core';
import { AssetAmount } from '../AssetAmount';

export const MustTokenBalance: React.FC<{ token: Token; specAccount?: string }> = (props) => {
  const { token } = props;
  const { account } = useEthers();
  const balance = useTokenBalance(token.address, props.specAccount ? props.specAccount : account);

  return (
    <span>
      Balance: <AssetAmount asset={{ token, amount: balance }} />
    </span>
  );
};

export const TokenBalance: React.FC<{ token?: Token; specAccount?: string }> = (props) => {
  const { account } = useEthers();

  if (!props.token || !account) {
    return (
      <span>
        <h4 className="mt2 dib">Balance In Gnosis Wallet: </h4>
        <AssetAmount asset={{ token: props.token }} />
      </span>
    );
  }

  return <MustTokenBalance token={props.token} specAccount={props.specAccount} />;
};
