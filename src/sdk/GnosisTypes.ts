import { ethers } from 'ethers';

export type TxHash = string;
export type Address = string;
export type HexString = string;


export interface UnsignedTxPayload {
  to: Address;
  value: ethers.BigNumber;
  data: HexString;  // e.g. "0x1234"
  nonce: number;
}

export interface SignedTxPayload extends UnsignedTxPayload {
  signatures: HexString;  // e.g. "0x1234"
  ownersApprovedSet: boolean[];
  sortedOwners: Address[];
}

export interface GnosisConfig {
  nonce: number;
  threshold: number;
  owners: Address[];
}

export interface GnosisSdkInterface {
  getGnosisConfig(): Promise<GnosisConfig>;

  getSafeTxHash(payload: UnsignedTxPayload): Promise<string>;

  getOwnersApproved(owners: Address[], safeTxHash: string): Promise<boolean[]>;

  signTransaction(payload: UnsignedTxPayload): Promise<string>;

  execTransaction(payload: SignedTxPayload): Promise<TxHash>;
}
