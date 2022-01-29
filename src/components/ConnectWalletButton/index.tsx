import { shortenAddress, useEthers } from '@usedapp/core';
import { Button, ButtonProps, message } from 'antd';
import { useEffect, useMemo } from 'react';
import { Configs } from '../../configs';
import { BigNumber } from 'ethers';
import styled from 'styled-components';

const ButtonWrapper = styled.div`
  button {
    margin-left: 2rem;
  }

  span {
    color: #f6b426;
  }

  .ant-btn:hover {
    opacity: 0.8;
  }
`;

export const ConnectWalletButton: React.FC<ButtonProps> = (props) => {
  const { account, activateBrowserWallet, library, chainId } = useEthers();

  function connectToWallet() {
    activateBrowserWallet((e) => message.error(e.message));
  }

  const displayAddress = useMemo(() => {
    if (!account) return account;
    return shortenAddress(account);
  }, [account]);

  useEffect(() => {
    if (!account) return;
    if (Number(chainId) === Number(Configs.NETWORK_CONFIG.chainId)) return;
    if (chainId == null || library == null) return;

    library.send('wallet_addEthereumChain', [
      { ...Configs.NETWORK_CONFIG, chainId: BigNumber.from(Configs.NETWORK_CONFIG.chainId).toHexString() },
    ]);
  }, [account, chainId, library]);

  return (
    <ButtonWrapper>
      <span>ChainId: {account ? chainId : '-'}</span>
      <Button onClick={connectToWallet} {...props}>
        {displayAddress ? displayAddress : 'Connect wallet'}
      </Button>
    </ButtonWrapper>
  );
};
