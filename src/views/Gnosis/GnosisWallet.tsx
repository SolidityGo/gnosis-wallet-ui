import React, {useState} from "react";
import {useGnosis} from "../../hooks/useGnosis";
import {ChainId, Token, useToken} from "@usedapp/core";
import {TokenInfo} from "@usedapp/core/dist/esm/src/model/TokenInfo";
import {UnsignedTxPayload} from "../../sdk/GnosisTypes";
import {useMutation} from "react-query";
import {Button, Input, notification} from "antd";
import {formatUnits, parseUnits} from "ethers/lib/utils";
import {BigNumber} from "ethers";
import {debug} from "../../utils/debug";
import {TokenBalance} from "../../components/TokenBalance";
import {isInputAddress, isInputFloatString} from "../../utils/string";
import { TxExecutor } from './TxExcutor'

export const GnosisWallet: React.FC<{ inputTokenAddress: string; gnosisProxyAddress: string }> = (props) => {
  const { inputTokenAddress, gnosisProxyAddress } = props;
  const { data: gnosis } = useGnosis(gnosisProxyAddress, inputTokenAddress);

  const selectToken = useToken(inputTokenAddress) as TokenInfo;
  const [inputAmount, setInputAmount] = useState('');
  const [inputReceiverAddress, setInputReceiverAddress] = useState('');

  const [unsignedTxPayload, setUnsignedTxPayload] = useState<UnsignedTxPayload | null>(null);

  const { mutateAsync: signTransaction, isLoading: isSigning } = useMutation(async () => {
    if (!gnosis) {
      return notification.error({ message: 'data loading' });
    }
    const payload = await generateUnsignedTxPayload();
    if (payload === null) {
      return notification.error({ message: 'invalid payload' });
    }

    setUnsignedTxPayload(payload);
    return await gnosis.signTransaction(payload);
  });

  const generateUnsignedTxPayload = async (): Promise<UnsignedTxPayload | null> => {
    if (
      !gnosis ||
      !inputTokenAddress ||
      !inputReceiverAddress ||
      inputAmount === '0' ||
      inputAmount === '' ||
      !selectToken?.decimals
    ) {
      return null;
    }
    const unsignedPayload = await gnosis.generateUnsignedTxPayload(
      inputTokenAddress,
      inputReceiverAddress,
      parseUnits(inputAmount, BigNumber.from(selectToken.decimals)),
      gnosis.nonce,
    );
    debug('unsignedPayload', unsignedPayload);
    return unsignedPayload;
  };

  return (
    <>
      <div>
        <h4 className="mt2">Owners:</h4> {gnosis ? gnosis.owners.map((address) => <div>{address}</div>) : ''}
      </div>
      <div>
        <h4 className="mt2">Threshold:</h4> {gnosis ? gnosis.threshold : ''}{' '}
      </div>

      <div className="mb4">
        <h1>Sign BEP-20 Transfer Tx</h1>

        <div>
          <h4 className="mt2">Token Name:</h4> {selectToken?.name}{' '}
        </div>
        <TokenBalance
          specAccount={gnosisProxyAddress}
          token={
            selectToken &&
            new Token(selectToken.name, selectToken.symbol, ChainId.BSC, inputTokenAddress, selectToken.decimals)
          }
        />

        <div className="mt2">Receiver</div>
        <Input
          className="ba b--grey mr2 mb2"
          value={inputReceiverAddress}
          onChange={(e) => isInputAddress(e.target.value) && setInputReceiverAddress(e.target.value)}
          placeholder=""
        />

        <div>Amount</div>
        <Input
          className="ba b--grey mr2 mb2"
          value={inputAmount}
          onChange={(e) => {
            isInputFloatString(e.target.value) && setInputAmount(e.target.value);
          }}
          placeholder="<= Balance"
          suffix={
            <Button
              size="small"
              type="link"
              onClick={() => {
                gnosis?.tokenBalance &&
                setInputAmount(formatUnits(gnosis.tokenBalance, BigNumber.from(selectToken.decimals)).toString());
              }}
            >
              MAX
            </Button>
          }
        />

        <div className="mb2">
          <h4 className="mt2">Gnosis Wallet Nonce:</h4> {gnosis ? gnosis.nonce : '-'}
        </div>

        <Button
          loading={isSigning}
          onClick={async () => {
            await signTransaction();
          }}
        >
          Sign Transaction
        </Button>
      </div>

      {unsignedTxPayload && gnosis && (
        <TxExecutor
          gnosisProxyAddress={gnosisProxyAddress}
          sortedOwners={gnosis?.owners}
          gnosis={gnosis}
          unsignedPayload={unsignedTxPayload}
        />
      )}
    </>
  );
};
