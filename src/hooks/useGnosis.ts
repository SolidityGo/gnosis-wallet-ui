import { useEthers } from '@usedapp/core';
import { useQuery, useQueryClient, UseQueryResult } from 'react-query';
import { asserts } from '../utils';
import { BigNumber, ethers } from 'ethers';
import { useGnosisSdk } from './useSdk';
import { Address, HexString, SignedTxPayload, UnsignedTxPayload } from '../sdk/GnosisTypes';
import { BUSD__factory, BUSD } from '../sdk/contracts';
import { clear0x } from '../utils/string';
import { debug } from '../utils/debug';

interface QueryGnosisResult {
  nonce: number;
  threshold: number;
  owners: Address[];

  tokenBalance: ethers.BigNumber;
  tokenAddress: string;

  generateUnsignedTxPayload(
    tokenAddress: Address,
    ERC20Receiver: Address,
    ERC20Amount: BigNumber,
    nonce: number,
  ): Promise<UnsignedTxPayload>;

  getSafeTxHash(unsignedTxPayload: UnsignedTxPayload): Promise<string>;

  generateSignedTxPayload(unsignedPayload: UnsignedTxPayload): Promise<SignedTxPayload>;

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
      const sortedOwners = [...owners] as string[];
      sortedOwners.sort();

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

        generateUnsignedTxPayload: async (
          tokenAddress: Address,
          ERC20Receiver: Address,
          ERC20Amount: BigNumber,
          nonce: number,
        ) => {
          const calldata = tokenInstance.interface.encodeFunctionData('transfer', [ERC20Receiver, ERC20Amount]);

          return {
            sender: gnosisProxyAddress,
            to: tokenAddress,
            value: BigNumber.from(0),
            data: calldata,
            nonce,
          } as UnsignedTxPayload;
        },
        getSafeTxHash: async (unsignedPayload) => {
          return await gnosisSdk.getSafeTxHash(unsignedPayload);
        },
        generateSignedTxPayload: async (unsignedPayload) => {
          let signaturesHex: HexString = '';
          const safeTxHash = await gnosisSdk.getSafeTxHash(unsignedPayload);

          const ownersApprovedSet = await gnosisSdk.getOwnersApproved(sortedOwners, safeTxHash);
          for (let i = 0; i < ownersApprovedSet.length; i++) {
            if (!ownersApprovedSet[i]) {
              continue;
            }
            signaturesHex +=
              `000000000000000000000000${clear0x(sortedOwners[i])}` +
              `0000000000000000000000000000000000000000000000000000000000000000` +
              `01`; // r, s, v
          }
          signaturesHex = '0x' + signaturesHex;

          debug('sortedOwners', sortedOwners);
          debug('signaturesHex', signaturesHex);
          return {
            ...unsignedPayload,
            signatures: signaturesHex,
            ownersApprovedSet,
            sortedOwners,
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

interface QueryApproveInfoResult {
  safeTxHash: string;
  ownersApprovedSet: boolean[];
  sortedOwners: string[];
  approvedCount: number;
}

export function useQueryApproveInfo(
  gnosisProxyAddress: string,
  sortedOwners: string[],
  unsignedPayload: UnsignedTxPayload,
): UseQueryResult<QueryApproveInfoResult> {
  const gnosisSdk = useGnosisSdk(gnosisProxyAddress);
  const { account } = useEthers();

  return useQuery<QueryApproveInfoResult>(
    ['queryApproveInfo', { account, unsignedPayload, gnosisProxyAddress }],
    async () => {
      asserts(gnosisSdk);
      asserts(gnosisProxyAddress);
      const safeTxHash = await gnosisSdk.getSafeTxHash(unsignedPayload);
      const ownersApprovedSet = await gnosisSdk.getOwnersApproved(sortedOwners, safeTxHash);

      let approvedCount: number = 0;
      for (const approved of ownersApprovedSet) {
        approvedCount += approved ? 1 : 0;
      }

      return {
        safeTxHash,
        approvedCount,
        ownersApprovedSet,
        sortedOwners,
      };
    },
    {
      refetchInterval: 2000,
      enabled: !!gnosisSdk && !!account && !!gnosisProxyAddress,
    },
  );
}
