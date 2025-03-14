import { useQuery } from '@apollo/client';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import React from 'react';
import { GET_INVOICE } from '../../../api/apollo';

interface InvoiceDetailsModalProps {
  invoiceID: string;
  onClose: () => void;
}

const InvoiceDetailsModal: React.FC<InvoiceDetailsModalProps> = ({
  invoiceID,
  onClose,
}) => {
  const { loading, error, data } = useQuery(GET_INVOICE, {
    variables: { invoiceID },
    skip: !invoiceID,
  });

  const invoice = data?.invoice;

  // Fonction pour formater les dates
  const formatDate = (date: string | null) =>
    date
      ? new Date(date).toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        })
      : 'N/A';

  // Calcul de la consommation en m³
  const quantityConsumed =
    (invoice?.record?.newRecord ?? 0) - (invoice?.record?.oldRecord ?? 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={!!invoiceID} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle
        sx={{
          backgroundColor: '#1976d2',
          color: '#fff',
          textAlign: 'center',
          py: 2,
        }}
      >
        <Typography variant="h5">Détails de la Facture</Typography>
      </DialogTitle>
      <DialogContent sx={{ p: 3 }}>
        {loading ? (
          <CircularProgress />
        ) : error ? (
          <Typography color="error">Erreur : {error.message}</Typography>
        ) : invoice ? (
          <>
            {/* Header Section */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={6}>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Informations de la Facture
                </Typography>
                <Typography>
                  <strong>Code Facture :</strong>{' '}
                  {invoice.invoiceID.substring(0, 8)}
                </Typography>
                <Typography>
                  <strong>Période :</strong> {invoice.record?.period ?? 'N/A'}
                </Typography>
                <Typography>
                  <strong>Date Facturation :</strong>{' '}
                  {formatDate(invoice.createdAt)}
                </Typography>
              </Grid>

              <Grid item xs={6}>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Relevé du Compteur
                </Typography>
                <Typography>
                  <strong>Date Relevé :</strong>{' '}
                  {formatDate(invoice.record?.recordDate)}
                </Typography>
                <Typography>
                  <strong>Prochain Relevé :</strong>{' '}
                  {formatDate(invoice.record?.nextRecordDate)}
                </Typography>
                <Typography>
                  <strong>Ancien Relevé :</strong>{' '}
                  {invoice.record?.oldRecord ?? 'N/A'} m³
                </Typography>
                <Typography>
                  <strong>Nouveau Relevé :</strong>{' '}
                  {invoice.record?.newRecord ?? 'N/A'} m³
                </Typography>
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />

            {/* Consumer and Counter Details */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={6}>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Détails du Consommateur
                </Typography>
                <Typography>
                  <strong>Code Consommateur :</strong>{' '}
                  {invoice.consumer?.consumerID.substring(0, 8) ?? 'N/A'}
                </Typography>
                <Typography>
                  <strong>Consommateur :</strong>{' '}
                  {invoice.consumer?.fullName ?? 'N/A'}
                </Typography>
              </Grid>

              <Grid item xs={6}>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Détails du Compteur
                </Typography>
                <Typography>
                  <strong>Code Compteur :</strong>{' '}
                  {invoice?.counter?.counterID ?? 'N/A'}
                </Typography>
                <Typography>
                  <strong>Statut :</strong> {invoice?.counter?.status ?? 'N/A'}
                </Typography>
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />

            {/* Consumption Table */}
            <Typography variant="h6" sx={{ mb: 2 }}>
              Détails de la Consommation
            </Typography>
            <TableContainer component={Paper} sx={{ mb: 3 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell align="center">
                      <strong>Quantité Consommée (m³)</strong>
                    </TableCell>
                    <TableCell align="right">
                      <strong>Prix Unitaire</strong>
                    </TableCell>
                    <TableCell align="right">
                      <strong>Total</strong>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell align="center">{quantityConsumed}</TableCell>
                    <TableCell align="right">X.XX</TableCell>{' '}
                    {/* Remplace par le prix réel */}
                    <TableCell align="right">
                      {Number(invoice.amount ?? 0).toFixed(2)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>

            {/* Total Amount */}
            <Typography variant="h6" align="right" sx={{ mt: 2 }}>
              <strong>Montant Total :</strong>{' '}
              {Number(invoice.amount ?? 0).toFixed(2)} DA
            </Typography>

            {/* Print Button (Hidden in Print Mode) */}
            <Box sx={{ mt: 3, textAlign: 'center' }} className="no-print">
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
