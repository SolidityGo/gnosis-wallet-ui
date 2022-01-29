import { ethers } from 'ethers';
import { GnosisSafe, GnosisSafe__factory } from './contracts';
import {UnsignedTxPayload, GnosisSdkInterface, GnosisConfig, SignedTxPayload} from './GnosisTypes';
import { JsonRpcSigner } from '@ethersproject/providers/src.ts/json-rpc-provider';
import { debug } from '../utils/debug';

export type TxHash = string;
export type Address = string;

export class GnosisSdk implements GnosisSdkInterface {
  readonly GnosisSafeContract: GnosisSafe;
  readonly signer: JsonRpcSigner;

  constructor(private GnosisSafeAddress: string, public provider: ethers.providers.Web3Provider) {
    this.GnosisSafeContract = GnosisSafe__factory.connect(GnosisSafeAddress, provider.getSigner());
    this.signer = provider.getSigner()
  }

  async getGnosisConfig(): Promise<GnosisConfig> {
    const nonce = await this.GnosisSafeContract.nonce()
    const threshold = await this.GnosisSafeContract.getThreshold()
    const owners = await this.GnosisSafeContract.getOwners()
    return {
      nonce: nonce.toNumber(),
      threshold: threshold.toNumber(),
      owners: owners,
    } as GnosisConfig
  }

  async signTransaction(payload: UnsignedTxPayload): Promise<string> {
    const safeTxHash = await this.GnosisSafeContract.getTransactionHash(
      payload.to,
      payload.value,
      payload.data,
      0,
      0,
      0,
      0,
      ethers.constants.AddressZero,
      ethers.constants.AddressZero,
      payload.nonce
    );

    const account = (await this.signer.getAddress()).toLowerCase()
    const signature = await this.signer.provider.send('eth_sign', [account, safeTxHash])
    debug("signature", signature);

    return signature
  }

  async execTransaction(payload: SignedTxPayload): Promise<TxHash> {
    const tx = await this.GnosisSafeContract.execTransaction(
      payload.to,
      payload.value,
      payload.data,
      0,
      0,
      0,
      0,
      ethers.constants.AddressZero,
      ethers.constants.AddressZero,
      payload.signatures,
    );


    await tx.wait();
    return tx.hash
  }
}
