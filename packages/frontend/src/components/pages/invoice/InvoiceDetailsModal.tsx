import { useQuery } from '@apollo/client';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  Typography,
} from '@mui/material';
import React from 'react';
import { GET_INVOICE } from '../../../api/apollo';
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
  const { loading, error, data } = useQuery(GET_INVOICE, {
    variables: { invoiceID },
    skip: !invoiceID,
  });

  const invoice = data?.invoice;
  console.log('==>',);

  const handlePrint = () => {
    window.print();
  };

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
            <InvoiceComponent invoice={invoice} settings={settings} />
            <Box
              sx={{ mt: 1, textAlign: 'center', '@media print': { display: 'none' } }}
            >
                <Button
                variant="contained"
                color="primary"
                onClick={handlePrint}
                sx={{ px: 4, py: 1 }}
                >
                Imprimer la Facture
                </Button>
            </Box>
          </>
        ) : (
          <Typography>Aucune donnée de facture disponible.</Typography>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default InvoiceDetailsModal;
