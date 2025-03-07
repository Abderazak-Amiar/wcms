import { useQuery } from '@apollo/client';
import React from 'react';
import { GET_RECORD, GET_SETTINGS } from '../../api/apollo';

type RecordData = {
  record: {
    recordID: string;
    consumer: {
      fullName: string;
    };
    oldRecord: number;
    newRecord: number;
    period: string;
    createdAt: string;
  };
};

type SettingsData = {
  settings: {
    m3Price: string;
    village: string;
  };
};

type InvoiceProps = {
  recordID: string;
};

const Invoice: React.FC<InvoiceProps> = ({ recordID }) => {
  const {
    data: recordData,
    loading: recordLoading,
    error: recordError,
  } = useQuery<RecordData>(GET_RECORD, {
    variables: { recordID },
  });
  console.log('==>RECORD DATA', recordData);
  const {
    data: settingsData,
    loading: settingsLoading,
    error: settingsError,
  } = useQuery<SettingsData>(GET_SETTINGS);

  if (recordLoading || settingsLoading) return <p>Loading...</p>;
  if (recordError) return <p>Error loading record: {recordError.message}</p>;
  if (settingsError)
    return <p>Error loading settings: {settingsError.message}</p>;

  if (!recordData || !settingsData) return <p>No data available</p>;

  const { consumer, oldRecord, newRecord, period, createdAt } =
    recordData.record;
  const { m3Price, village } = settingsData.settings;
  const consumption = newRecord - oldRecord;
  const totalPrice = consumption * parseFloat(m3Price);

  return (
    <div style={{ border: '1px solid #000', padding: '20px', width: '400px' }}>
      <h2>Invoice</h2>
      <p>
        <strong>Village:</strong> {village}
      </p>
      <p>
        <strong>Consumer:</strong> {consumer.fullName}
      </p>
      <p>
        <strong>Period:</strong> {period}
      </p>
      <p>
        <strong>Date:</strong> {new Date(createdAt).toLocaleDateString()}
      </p>
      <p>
        <strong>Old Reading:</strong> {oldRecord} m³
      </p>
      <p>
        <strong>New Reading:</strong> {newRecord} m³
      </p>
      <p>
        <strong>Consumption:</strong> {consumption} m³
      </p>
      <p>
        <strong>Price per m³:</strong> {m3Price} DZD
      </p>
      <h3>
        <strong>Total Amount:</strong> {totalPrice.toFixed(2)} DZD
      </h3>
    </div>
  );
};

export default Invoice;
