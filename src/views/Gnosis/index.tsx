import React, { useState } from 'react';
import { Button, Input, notification } from 'antd';
import styled from 'styled-components';
import { isInputAddress } from '../../utils/string';
import { ethers } from 'ethers';
import { ConnectWalletButton } from '../../components/ConnectWalletButton';
import { GnosisWallet } from './GnosisWallet';

export const Gnosis: React.FC = () => {
  const [gnosisProxyAddress, setGnosisProxyAddress] = useState('');
  const [inputTokenAddress, setInputTokenAddress] = useState('');

  return (
    <FullContainer>
      <ConnectWalletButton />

      <div className="mb4">
        <h1>Info</h1>
        <div>GnosisSafe Proxy Address</div>
        <Input
          className="ba b--grey mr2 mb2"
          value={gnosisProxyAddress}
          onChange={(e) => {
            if (e.target.value.startsWith('bnb:')) {
              return setGnosisProxyAddress(e.target.value.substring(4));
            }
            return isInputAddress(e.target.value) && setGnosisProxyAddress(e.target.value);
          }}
          placeholder=""
        />

        <div>Token Address</div>
        <Input
          className="ba b--grey mr2 mb2"
          value={inputTokenAddress}
          onChange={(e) => isInputAddress(e.target.value) && setInputTokenAddress(e.target.value)}
          placeholder=""
        />

        {ethers.utils.isAddress(inputTokenAddress) && ethers.utils.isAddress(gnosisProxyAddress) ? (
          <GnosisWallet inputTokenAddress={inputTokenAddress} gnosisProxyAddress={gnosisProxyAddress} />
        ) : (
          <>
            <h1>Sign BEP-20 Transfer Tx</h1>
            <Button
              onClick={() => {
                notification.error({
                  message: 'please input your GnosisSafe Address and the Token Address you want transfer',
                });
              }}
            >
              Sign Transaction
            </Button>

            <h1>Execute Multi-Signed Tx</h1>
            <Button
              onClick={() => {
                notification.error({ message: 'please collect enough signatures' });
              }}
            >
              Execute Transaction
            </Button>
          </>
        )}
      </div>
    </FullContainer>
  );
};

const FullContainer = styled.div`
  padding: 6rem;

  input.ant-input::placeholder {
    color: rgba(69, 73, 80, 0.81);
  }
`;
