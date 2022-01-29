import { useEthers } from '@usedapp/core';
import { useQuery, useQueryClient, UseQueryResult } from 'react-query';
import { asserts } from '../utils';
import { BigNumber, ethers } from 'ethers';
import { useGnosisSdk } from './useSdk';
import {Address, HexString, SignedTxPayload, UnsignedTxPayload} from '../sdk/GnosisTypes';
import { BUSD__factory, BUSD } from '../sdk/contracts';
import {clear0x} from "../utils/string";
import {debug} from "../utils/debug";

interface QueryGnosisResult {
  nonce: number;
  threshold: number;
  owners: Address[];

  tokenBalance: ethers.BigNumber;
  tokenAddress: string;

  generateUnsignedTxPayload(tokenAddress: Address, ERC20Receiver: Address, ERC20Amount: BigNumber, nonce: number): Promise<UnsignedTxPayload>;
  generateSignedTxPayload(unsignedPayload: UnsignedTxPayload, signatures: string[]): Promise<SignedTxPayload>;

  signTransaction: (payload: UnsignedTxPayload) => Promise<string>;
  execTransaction: (payload: SignedTxPayload) => Promise<string>;
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
      const sortedOwners = [...owners] as string[]
      sortedOwners.sort()

      let tokenInstance: BUSD;
      let tokenBalance = BigNumber.from(0);
      if (library && account) {
        tokenInstance = BUSD__factory.connect(tokenAddress, library.getSigner());
        tokenBalance = await tokenInstance.balanceOf(gnosisProxyAddress);
      }

      return {
        nonce,
        threshold,
        owners: sortedOwners,
        tokenBalance,
        tokenAddress,
        generateUnsignedTxPayload: async (tokenAddress: Address, ERC20Receiver: Address, ERC20Amount: BigNumber, nonce: number) => {
          const tx = await tokenInstance.populateTransaction.transfer(ERC20Receiver, ERC20Amount);
          return {
            sender: gnosisProxyAddress,
            to: tokenAddress,
            value: BigNumber.from(0),
            data: tx.data || '',
            nonce,
          } as UnsignedTxPayload;
        },
        generateSignedTxPayload: async (unsignedPayload, signatureSet ) => {
          let signaturesHex: HexString = '';
          for (let i = 0; i < signatureSet.length; i++) {
            const sig = signatureSet[i];
            signaturesHex += clear0x(sig);
          }
          signaturesHex = '0x' +signaturesHex
          return {
            ...unsignedPayload,
            signatures: signaturesHex
          } as SignedTxPayload;
        },
        signTransaction: async (payload) =>
          gnosisSdk.signTransaction(payload).then(async (signature) => {
            await client.invalidateQueries('queryGnosis');
            return signature;
          }),

        execTransaction: async (payload) =>
          gnosisSdk.execTransaction(payload).then(async (txHash) => {
            await client.invalidateQueries('queryGnosis');
            return txHash;
          }),
      };
    },
    {
      enabled: !!gnosisSdk && !!account && !!gnosisProxyAddress && !!tokenAddress,
    },
  );
}
