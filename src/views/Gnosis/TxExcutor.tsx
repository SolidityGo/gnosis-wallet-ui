import React from 'react';
import { UnsignedTxPayload } from '../../sdk/GnosisTypes';
import { useQueryApproveInfo } from '../../hooks/useGnosis';
import { useMutation } from 'react-query';
import { Button, List, notification } from 'antd';

export const TxExecutor: React.FC<{
  gnosisProxyAddress: string;
  sortedOwners: string[];
  unsignedPayload: UnsignedTxPayload;
  gnosis: any;
}> = ({ gnosisProxyAddress, sortedOwners, unsignedPayload, gnosis }) => {
  const { data: ownersApprovedInfo } = useQueryApproveInfo(gnosisProxyAddress, sortedOwners, unsignedPayload);

  const { mutateAsync: execTransaction, isLoading: isExecuting } = useMutation(
    async (unsignedPayload: UnsignedTxPayload) => {
      const payload = await gnosis.generateSignedTxPayload(unsignedPayload);

      console.log('signedPayload', payload);
      gnosis.execTransaction(payload).then(() => {
        notification.success({ message: 'exec tx succeed' });
      });
    },
  );

  const renderInputSignatures = () => {
    if (!gnosis || !ownersApprovedInfo) {
      return;
    }
    const inputList = [];
    for (let i = 0; i < gnosis.threshold; i++) {
      inputList.push(
        <List.Item key={i}>
          <div>
            {ownersApprovedInfo.sortedOwners[i]} - {ownersApprovedInfo.ownersApprovedSet[i] && 'approved'}
          </div>
        </List.Item>,
      );
    }
    return (
      <div>
        <div>Approved Count: {ownersApprovedInfo.approvedCount}</div>
        <div>Threshold: {gnosis.threshold}</div>
        <List>{inputList}</List>
      </div>
    );
  };

  return (
    <div className="mb4">
      <h1>Execute Multi-Signed Tx</h1>
      {gnosis && ownersApprovedInfo && renderInputSignatures()}
      <Button
        loading={isExecuting}
        onClick={async () => {
          await execTransaction(unsignedPayload);
        }}
      >
        Exec Transaction
      </Button>
    </div>
  );
};
