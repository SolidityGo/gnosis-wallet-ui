import React, {useState} from 'react';
import {Button, Input, List, notification, Typography} from 'antd';
import styled from 'styled-components';
import {useGnosis} from '../../hooks/useGnosis';
import {useMutation} from 'react-query';
import {debug} from '../../utils/debug';
import {formatUnits, parseUnits} from 'ethers/lib/utils';
import {ChainId, Token, useToken} from '@usedapp/core';
import {TokenBalance} from '../../components/TokenBalance';
import {UnsignedTxPayload} from '../../sdk/GnosisTypes';
import {isInputAddress, isInputFloatString, isInputSignatureString} from '../../utils/string'
import {BigNumber, ethers} from "ethers";
import {ConnectWalletButton} from "../../components/ConnectWalletButton";
import {TokenInfo} from "@usedapp/core/dist/esm/src/model/TokenInfo";

export const WalletToken: React.FC<{ inputTokenAddress: string; gnosisProxyAddress: string; }> = (props) => {
  const {inputTokenAddress, gnosisProxyAddress} = props
  const {data: gnosis} = useGnosis(gnosisProxyAddress, inputTokenAddress);

  const selectToken = useToken(inputTokenAddress) as TokenInfo;
  const [inputAmount, setInputAmount] = useState('');
  const [inputReceiverAddress, setInputReceiverAddress] = useState('');
  const [mySignature, setMySignature] = useState('');

  const [unsignedTxPayload, setUnsignedTxPayload] = useState<UnsignedTxPayload | null>(null)

  const {mutateAsync: signTransaction, isLoading: isSigning} = useMutation(
    async () => {
      if (!gnosis) {
        return notification.error({message: 'data loading'});
      }
      const payload = await generateUnsignedTxPayload();
      if (payload === null) {
        return notification.error({message: 'invalid payload'});
      }

      setUnsignedTxPayload(payload)
      return await gnosis.signTransaction(payload);
    },
  );

  const generateUnsignedTxPayload = async (): Promise<UnsignedTxPayload | null> => {
    if (!gnosis || !inputTokenAddress || !inputReceiverAddress || inputAmount === '0' || inputAmount === '' || !selectToken?.decimals) {
      return null;
    }
    const unsignedPayload = await gnosis.generateUnsignedTxPayload(inputTokenAddress, inputReceiverAddress, parseUnits(inputAmount, BigNumber.from(selectToken.decimals)), gnosis.nonce);
    debug('unsignedPayload', unsignedPayload)
    return unsignedPayload;
  };

  return (
    <>
      <div><h4 className='mt2'>Owners:</h4>  {gnosis ? gnosis.owners.map(address => (<div>{address}</div>)) : ''}
      </div>
      <div><h4 className='mt2'>Threshold:</h4>  {gnosis ? gnosis.threshold : ''} </div>

      <div className='mb4'>
        <h1>Sign BEP-20 Transfer Tx</h1>

        <div><h4 className='mt2'>Token Name:</h4>  {selectToken?.name} </div>
        <TokenBalance specAccount={gnosisProxyAddress} token={
          selectToken && new Token(selectToken.name, selectToken.symbol, ChainId.BSC, inputTokenAddress, selectToken.decimals)
        }/>

        <div className='mt2'>Receiver</div>
        <Input
          className='ba b--grey mr2 mb2'
          value={inputReceiverAddress}
          onChange={(e) => isInputAddress(e.target.value) && setInputReceiverAddress(e.target.value)}
          placeholder=''
        />

        <div>Amount</div>
        <Input
          className='ba b--grey mr2 mb2'
          value={inputAmount}
          onChange={(e) => {
            isInputFloatString(e.target.value) && setInputAmount(e.target.value);
          }}
          placeholder='<= Balance'
          suffix={
            <Button size="small" type="link" onClick={() => {
              gnosis?.tokenBalance && setInputAmount(formatUnits(gnosis.tokenBalance, BigNumber.from(selectToken.decimals)).toString())
            }}>
              MAX
            </Button>
          }
        />

        <div className='mb2'><h4 className='mt2'>Gnosis Wallet Nonce:</h4> {gnosis ? gnosis.nonce : '-'}</div>

        <Button loading={isSigning} onClick={async () => {
          const sig = await signTransaction() as string;
          setMySignature(sig);
        }}>Sign Transaction</Button>

        <div><h4 className='mt2'>My Signature:</h4></div>
        <h4>
          <Typography.Text strong>{mySignature}</Typography.Text>
        </h4>
      </div>

      {unsignedTxPayload && <TxExecutor gnosis={gnosis} unsignedPayload={unsignedTxPayload}/>}
    </>
  )
}

export const TxExecutor: React.FC<{ unsignedPayload: UnsignedTxPayload; gnosis: any }> = ({
                                                                                            unsignedPayload,
                                                                                            gnosis
                                                                                          }) => {

  const [signatures, setSignatures] = useState<string[]>([]);

  const {mutateAsync: execTransaction, isLoading: isExecuting} = useMutation(
    async (unsignedPayload: UnsignedTxPayload) => {
      if (!gnosis || signatures.length < gnosis.threshold) {
        return notification.error({message: 'signatures not enough'});
      }

      const payload = await gnosis.generateSignedTxPayload(unsignedPayload, signatures);
      console.log("signedPayload", payload)
      gnosis.execTransaction(payload).then(() => {
        notification.success({message: "exec tx succeed"})
      })
    },
  );

  const renderInputSignatures = () => {
    if (!gnosis) {
      return;
    }
    const inputList = [];
    for (let i = 0; i < gnosis.threshold; i++) {
      inputList.push(
        <List.Item>
          <Input
            key={i}
            className='ba b--grey mr2 mb2'
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
    <div className='mb4'>
      <h1>Execute Multi-Signed Tx</h1>
      {
        gnosis && renderInputSignatures()
      }
      <Button loading={isExecuting} onClick={async () => {
        await execTransaction(unsignedPayload);
      }}>Exec Transaction</Button>
    </div>
  )
}

export const Gnosis: React.FC = () => {
  const [gnosisProxyAddress, setGnosisProxyAddress] = useState('');
  const [inputTokenAddress, setInputTokenAddress] = useState('');

  return (
    <FullContainer>
      <ConnectWalletButton/>

      <div className='mb4'>
        <h1>Info</h1>
        <div>GnosisSafe Proxy Address</div>
        <Input
          className='ba b--grey mr2 mb2'
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
          className='ba b--grey mr2 mb2'
          value={inputTokenAddress}
          onChange={(e) => isInputAddress(e.target.value) && setInputTokenAddress(e.target.value)}
          placeholder=''
        />

        {(ethers.utils.isAddress(inputTokenAddress) && ethers.utils.isAddress(gnosisProxyAddress))
          ? <WalletToken inputTokenAddress={inputTokenAddress} gnosisProxyAddress={gnosisProxyAddress}/>
          : <>
            <h1>Sign BEP-20 Transfer Tx</h1>
            <Button onClick={() => {
              notification.error({message: 'please input your GnosisSafe Address and the Token Address you want transfer'});
            }
            }>Sign Transaction</Button>

            <h1>Execute Multi-Signed Tx</h1>
            <Button onClick={() => {
              notification.error({message: 'please collect enough signatures'});
            }
            }>Execute Transaction</Button>
          </>

        }
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
