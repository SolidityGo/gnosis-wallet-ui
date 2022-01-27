import React, {useState} from 'react';
import {Button, Input, List, notification, Typography} from 'antd';
import styled from 'styled-components';
import {useGnosis} from '../../hooks/useGnosis';
import {useMutation} from 'react-query';
import {debug} from '../../utils/debug';
import {formatUnits, parseUnits} from 'ethers/lib/utils';
import {ChainId, Token, useToken} from '@usedapp/core';
import {TokenBalance} from '../../components/TokenBalance';
import {TxPayload} from '../../sdk/GnosisTypes';
import {isInputAddress, isInputFloatString, clear0x, isInputSignatureString} from '../../utils/string'
import {BigNumber} from "ethers";

export const Gnosis: React.FC = () => {
  const [inputTokenAddress, setInputTokenAddress] = useState('');
  const selectToken = useToken(inputTokenAddress);
  const [gnosisProxyAddress, setGnosisProxyAddress] = useState('');

  const {data: gnosis} = useGnosis(gnosisProxyAddress, inputTokenAddress);

  const [inputAmount, setInputAmount] = useState('');
  const [inputReceiverAddress, setInputReceiverAddress] = useState('');

  const [mySignature, setMySignature] = useState('');
  const [signatures, setSignatures] = useState<string[]>([]);

  const {mutateAsync: signTransaction, isLoading: isSigning} = useMutation(
    async () => {
      const payload = await generateTxPayload();
      if (!gnosis) {
        return notification.error({message: 'data loading'});
      }
      if (payload === null) {
        return notification.error({message: 'invalid payload'});
      }
      return await gnosis.signTransaction(payload);
    },
  );

  const {mutateAsync: execTransaction, isLoading: isExecuting} = useMutation(
    async () => {
      if (!gnosis) {
        return notification.error({message: 'data loading'});
      }

      if (signatures.length < gnosis.threshold) {
        return notification.error({message: 'signatures not enough'});
      }

      const payload = await generateTxPayload(signatures);

      if (payload === null) {
        return notification.error({message: 'invalid payload'});
      }

      await gnosis.execTransaction(payload);
      setSignatures([]);
    },
  );

  const generateTxPayload = async (signatures?: string[]): Promise<TxPayload | null> => {
    if (!gnosis || !inputReceiverAddress || inputAmount === '0' || inputAmount === '' || !selectToken?.decimals) {
      return null;
    }
    const payload = await gnosis.generateTxPayload(inputTokenAddress, inputReceiverAddress, parseUnits(inputAmount, BigNumber.from(selectToken.decimals)), gnosis.nonce);

    if (signatures) {
      let signaturesHex = '';
      for (let i = 0; i < signatures.length; i++) {
        const sig = signatures[i];
        signaturesHex += clear0x(sig);
        payload.signatures = '0x' + signaturesHex;
      }
    }

    debug('generateTxPayload',
      payload,
    );

    return payload;
  };

  const setMaxInputAmount = () => {
    if (!selectToken || !gnosis?.tokenBalance) {
      return
    }
    setInputAmount(formatUnits(gnosis.tokenBalance, BigNumber.from(selectToken.decimals)).toString())
  }

  const renderInputSignatures = () => {
    if (!gnosis) {
      return;
    }
    const inputList = [];
    for (let i = 0; i < gnosis.threshold; i++) {
      inputList.push(
        <List.Item>
          <Input
            className='ba b--green mr2 mb2'
            value={signatures.length > i ? signatures[i] : ''}
            onChange={(e) => isInputSignatureString(e.target.value) && setSignatures((prev: string[]) => {
              const newSigs: string[] = [...prev];
              newSigs[i] = e.target.value;
              return newSigs;
            })}
            placeholder='signature by each owner'
          />
        </List.Item>,
      );
    }
    return <List>
      {inputList}
    </List>;
  };

  return (
    <FullContainer>
      <div className='mb4'>
        <h1>Info</h1>
        <div>GnosisSafe Proxy Address</div>
        <Input
          className='ba b--green mr2 mb2'
          value={gnosisProxyAddress}
          onChange={(e) => {
            if (e.target.value.startsWith('bnb:')) {
              setGnosisProxyAddress(e.target.value.substring(4))
              return;
            }
            return isInputAddress(e.target.value) && setGnosisProxyAddress(e.target.value);
          }}
          placeholder=''
        />

        <div>Token Address</div>
        <Input
          className='ba b--green mr2 mb2'
          value={inputTokenAddress}
          onChange={(e) => isInputAddress(e.target.value) && setInputTokenAddress(e.target.value)}
          placeholder=''
        />
        <div><h4 className='mt2'>Token Name:</h4>  {selectToken?.name} </div>
        <TokenBalance specAccount={gnosisProxyAddress} token={
          selectToken && new Token(selectToken.name, selectToken.symbol, ChainId.BSC, inputTokenAddress, selectToken.decimals)
        }/>

        <div><h4 className='mt2'>Owners:</h4>  {gnosis ? gnosis.owners.map(address => (<div>{address}</div>)) : ''}
        </div>
        <div><h4 className='mt2'>Threshold:</h4>  {gnosis ? gnosis.threshold : ''} </div>

      </div>

      <div className='mb4'>
        <h1>Sign BEP-20 Transfer Tx</h1>

        <div>Receiver</div>
        <Input
          className='ba b--green mr2 mb2'
          value={inputReceiverAddress}
          onChange={(e) => isInputAddress(e.target.value) && setInputReceiverAddress(e.target.value)}
          placeholder=''
        />

        <div>Amount</div>
        <Input
          className='ba b--green mr2 mb2'
          value={inputAmount}
          onChange={(e) => {
            isInputFloatString(e.target.value) && setInputAmount(e.target.value);
          }}
          placeholder='<= Balance'
          suffix={
            <Button size="small" type="link" onClick={setMaxInputAmount}>
              MAX
            </Button>
          }
        />

        <div className='mb2'><h4 className='mt2'>Gnosis Wallet Nonce:</h4> {gnosis ? gnosis.nonce : '-'}</div>

        <Button loading={isSigning} onClick={async () => {
          const sig = await signTransaction() as string;
          console.log('sig', sig);
          setMySignature(sig);
        }}>Sign Transaction</Button>

        <div><h4 className='mt2'>My Signature:</h4></div>
        <h4>
          <Typography.Text strong>{mySignature}</Typography.Text>
        </h4>
      </div>

      <div className='mb4'>
        <h1>Execute Multi-Signed Tx</h1>
        {
          gnosis && renderInputSignatures()
        }
        <Button loading={isExecuting} onClick={async () => {
          await execTransaction();
        }}>Exec Transaction</Button>
      </div>
    </FullContainer>
  );
};

const FullContainer = styled.div`
  padding: 10rem;

  input.ant-input::placeholder {
    color: rgba(69, 73, 80, 0.81);
  }
`;
