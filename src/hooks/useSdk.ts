import { GnosisSdkInterface, GnosisSdk } from '../sdk';
import { useEthers } from '@usedapp/core';
import { useMemo } from 'react';

export function useGnosisSdk(gnosisProxyAddress: string): GnosisSdkInterface | undefined {
  const { library } = useEthers();

  return useMemo<undefined | GnosisSdkInterface>(() => {
    if (!library || !gnosisProxyAddress) return undefined;

    return new GnosisSdk(gnosisProxyAddress, library);
  }, [library, gnosisProxyAddress]);
}
