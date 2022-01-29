import { ethers } from 'ethers';

export const isInputAddress = (address: string) => {
  return ethers.utils.isAddress(address) || address === '';
};

export const isInputFloatString = (text: string) => {
  return /^\d*(\.\d*)?$/.test(text);
};
export const isInputSignatureString = (text: string) => {
  return text === '' || /^0x(\d|[a-f]|[A-F]){130}$/.test(text);
};

export const clear0x = (hexStr: string) => {
  return hexStr.startsWith('0x') ? hexStr.slice(2) : hexStr;
};
