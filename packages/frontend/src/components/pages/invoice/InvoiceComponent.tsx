import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import moment from 'moment';
import React from 'react';

type Invoice = {
  invoiceID: string;
  createdAt: string;
  amount: number;
  isPaid: boolean;
  isPrinted: boolean;
  consumer: {
    consumerID: string;
    fullName: string;
  };
  record: {
    period: string;
    recordDate: string;
    nextRecordDate: string;
    oldRecord: number;
    newRecord: number;
  };
  counter: {
    counterID: string;
    status: string;
  };
  debt: {
    isPaid: boolean;
    amount: string;
    createdAt: string;
    invoiceID: string;
  };
};

type Settings = {
  getSettings: {
    m3price: GLfloat;
    village: string;
    phone: string;
    email: string;
    deadline: string;
  };
};
interface InvoiceProps {
  invoice: Invoice;
  settings: Settings;
}

const InvoiceComponent: React.FC<InvoiceProps> = ({ invoice, settings }) => {
  const quantityConsumed =
    (invoice?.record?.newRecord ?? 0) - (invoice?.record?.oldRecord ?? 0);

  console.log('==>invoice', invoice);

  return (
    <Box p={2}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Facture D'eau
        </Typography>
        <Typography variant="h4" fontWeight="bold">
          Village {settings?.getSettings.village?.toUpperCase()}
        </Typography>
      </Box>

      {/* Invoice Details */}
      <TableContainer component={Paper} sx={{ mb: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell align="center">
                <b>Code Facture</b>
              </TableCell>
              <TableCell align="center">
                <b>Période</b>
              </TableCell>
              <TableCell align="center">
                <b>Date</b>
              </TableCell>
              <TableCell align="center">
                <b>Status</b>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell align="center">
                {invoice?.invoiceID || 'N/A'}
              </TableCell>
              <TableCell align="center">
                {invoice?.record?.period || 'N/A'}
              </TableCell>
              <TableCell align="center">
                {moment(invoice?.createdAt).format('DD MMM YYYY')}
              </TableCell>{' '}
              <TableCell align="center">
                {invoice?.isPaid
                  ? invoice?.debt?.isPaid === false
                    ? 'PP'
                    : 'P'
                  : 'NP'}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      {/* Consumer Details */}
      <TableContainer component={Paper} sx={{ mb: 3 }}>
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>
                <b>Consommateur:</b>
              </TableCell>
              <TableCell>{invoice?.consumer?.fullName || ''}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>
                <b>Code consommateur:</b>
              </TableCell>
              <TableCell>{invoice?.consumer?.consumerID || ''}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      {/* Consumption Details */}
      <TableContainer component={Paper} sx={{ mb: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <b>Date Relevé</b>
              </TableCell>
              <TableCell>
                <b>Prochain Relevé</b>
              </TableCell>
              <TableCell>
                <b>Ancien Relevé</b>
              </TableCell>
              <TableCell>
                <b>Nouveau Relevé</b>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell>
                {moment(invoice?.record?.recordDate).format('DD MMM YYYY')}
              </TableCell>
              <TableCell>
                {moment(invoice?.record?.nextRecordDate).format('DD MMM YYYY')}
              </TableCell>
              <TableCell>{invoice?.record?.oldRecord} m³</TableCell>
              <TableCell>{invoice?.record?.newRecord} m³</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      {/* Billing Details */}
      <TableContainer component={Paper} sx={{ mb: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <b>Quantité Consommée</b>
              </TableCell>
              <TableCell>
                <b>Prix Unitaire</b>
              </TableCell>
              <TableCell>
                <b>Total</b>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell>{quantityConsumed} m³</TableCell>
              <TableCell>
                {isNaN(Number(invoice?.amount) / Number(quantityConsumed))
                  ? '0.00'
                  : (
                      Number(invoice?.amount) / Number(quantityConsumed)
                    ).toFixed(2)}{' '}
                DA
              </TableCell>
              <TableCell>
                {Number(invoice?.amount ?? 0).toFixed(2)} DA
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
      <TableContainer component={Paper} sx={{ mb: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <b>Due</b>
              </TableCell>
              <TableCell>
                <b>Payé</b>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell>{invoice?.amount} DA</TableCell>
              <TableCell>
                {invoice?.isPaid && !invoice?.debt?.isPaid
                  ? (
                      Number(invoice?.amount) - Number(invoice?.debt?.amount)
                    ).toFixed(2) + ' DA'
                  : '0 DA'}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
      <TableContainer component={Paper} sx={{ mb: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <b>Dette</b>
              </TableCell>
              <TableCell>
                <b>Date</b>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell>
                {Number(invoice?.debt?.amount ?? 0).toFixed(2)} DA
              </TableCell>
              <TableCell>
                {moment(invoice?.debt?.createdAt).format('DD MMM YYYY')}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      {/* Total Amount */}
      <Box textAlign="right" my={2}>
        <Typography variant="h6">
          Montant total:{' '}
          {invoice?.isPaid && !invoice?.debt?.isPaid
            ? Number(invoice?.debt?.amount).toFixed(2) + ' DA'
            : invoice?.amount}{' '}
          DA
        </Typography>
      </Box>

      {/* Terms & Notes */}
      <Box mt={3}>
        <Typography variant="h6" fontWeight="bold">
          Conditions & Remarques
        </Typography>
        <Typography>
          Veuillez, s'il vous plaît, vous approcher du bureau du comité du
          village afin de payer votre facture avant le{' '}
          {moment(invoice?.createdAt)
            .add(settings.getSettings.deadline, 'days')
            .format('DD MMM YYYY')}
          . Nous vous remercions pour votre fidélité.
        </Typography>
      </Box>
    </Box>
  );
};

export default InvoiceComponent;
