import { useQuery } from '@apollo/client';
import {
  CircularProgress,
  Dialog,
  DialogContent,
  Typography,
} from '@mui/material';
import React from 'react';
import { GET_INVOICE, getDebtsByConsumer } from '../../../api/apollo';
import InvoiceComponent from './InvoiceComponent';
type Settings = {
  getSettings: {
    m3price: GLfloat;
    village: string;
    phone: string;
    email: string;
    deadline: string;
  };
};
interface InvoiceDetailsModalProps {
  invoiceID: string;
  onClose: () => void;
  settings: Settings;
}

const InvoiceDetailsModal: React.FC<InvoiceDetailsModalProps> = ({
  invoiceID,
  onClose,
  settings,
}) => {
  console.log('==>invoiceID', invoiceID);
  const { loading, error, data } = useQuery(GET_INVOICE, {
    variables: { invoiceID },
    skip: !invoiceID,
  });
  console.log('==>datadata', data?.invoice?.consumer?.consumerID);
  const consumerID = data?.invoice?.consumer?.consumerID;

  const {
    loading: debtsLoading,
    error: debtsError,
    data: debts,
  } = useQuery(getDebtsByConsumer, {
    variables: { consumerID: consumerID },
    skip: !consumerID,
  });
  const consumerDebts = debts?.getDebtsByConsumer;

  console.log('==>consumerDebtData', debts);
  const invoice = data?.invoice;

  return (
    <Dialog
      open={!!invoiceID}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      className="no-margin-print"
    >
      <DialogContent sx={{ p: 1 }}>
        {loading ? (
          <CircularProgress />
        ) : error ? (
          <Typography color="error">Erreur : {error.message}</Typography>
        ) : invoice ? (
          <>
            <InvoiceComponent
              invoice={invoice}
              settings={settings}
              debts={consumerDebts}
            />
          </>
        ) : (
          <Typography>Aucune donnée de facture disponible.</Typography>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default InvoiceDetailsModal;
