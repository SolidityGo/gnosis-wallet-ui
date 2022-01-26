import { useEthers } from '@usedapp/core';
import { useQuery, useQueryClient, UseQueryResult } from 'react-query';
import { asserts } from '../utils';
import { BigNumber, ethers } from 'ethers';
import { useGnosisSdk } from './useSdk';
import { Address, TxPayload } from '../sdk/GnosisTypes';
import { BUSD__factory, BUSD } from '../sdk/contracts';

interface QueryGnosisResult {
  nonce: number;
  threshold: number;
  owners: Address[];

  tokenBalance: ethers.BigNumber;
  tokenAddress: string;

  generateTxPayload(tokenAddress: Address, ERC20Receiver: Address, ERC20Amount: BigNumber, nonce: number): Promise<TxPayload>;

  signTransaction: (payload: TxPayload) => Promise<string>;
  execTransaction: (payload: TxPayload) => Promise<string>;
}

export function useGnosis(gnosisProxyAddress: string, tokenAddress: string): UseQueryResult<QueryGnosisResult> {
  const gnosisSdk = useGnosisSdk(gnosisProxyAddress);
  const { account, library } = useEthers();
  const client = useQueryClient();

  return useQuery<QueryGnosisResult>(
    ['queryGnosis', { account, gnosisProxyAddress, tokenAddress }],
    async () => {
      asserts(gnosisSdk);
      asserts(gnosisProxyAddress);
      asserts(tokenAddress);
      const { nonce, threshold, owners } = await gnosisSdk.getGnosisConfig();
      let tokenInstance: BUSD;
      let tokenBalance = BigNumber.from(0);
      if (library && account) {
        tokenInstance = BUSD__factory.connect(tokenAddress, library.getSigner());
        tokenBalance = await tokenInstance.balanceOf(gnosisProxyAddress);
      }

      return {
        nonce,
        threshold,
        owners,
        tokenBalance,
        tokenAddress,
        generateTxPayload: async (tokenAddress: Address, ERC20Receiver: Address, ERC20Amount: BigNumber, nonce: number) => {
          const tx = await tokenInstance.populateTransaction.transfer(ERC20Receiver, ERC20Amount);
          return {
            sender: gnosisProxyAddress,
            to: tokenAddress,
            value: BigNumber.from(0),
            data: tx.data || '',
            nonce,
          } as TxPayload;
        },
        signTransaction: async (payload) =>
          gnosisSdk.signTransaction(payload).then((hash) => {
            client.invalidateQueries('queryGnosis');
            return hash;
          }),

        execTransaction: async (payload) =>
          gnosisSdk.execTransaction(payload).then((hash) => {
            client.invalidateQueries('queryGnosis');
            return hash;
          }),
      };
    },
    {
      enabled: !!gnosisSdk && !!account,
    },
  );
}
