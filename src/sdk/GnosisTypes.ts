import { ethers } from 'ethers';

export type TxHash = string;
export type Address = string;
export type HexString = string;


export interface TxPayload {
  sender?: Address;
  to: Address;
  value: ethers.BigNumber;
  data: HexString;  // e.g. "0x1234"
  nonce: number;
  signatures?: HexString;  // e.g. "0x1234"
}

export interface GnosisConfig {
  nonce: number;
  threshold: number;
  owners: Address[];
}

export interface GnosisSdkInterface {
  getGnosisConfig(): Promise<GnosisConfig>;

  signTransaction(payload: TxPayload): Promise<TxHash>;

  execTransaction(payload: TxPayload): Promise<TxHash>;
}
