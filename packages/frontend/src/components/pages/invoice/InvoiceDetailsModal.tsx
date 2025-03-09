import { useQuery } from '@apollo/client';
import {
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
      <DialogTitle className="invoice-header">
        Détails de la Facture
      </DialogTitle>
      <DialogContent className="invoice-container">
        {loading ? (
          <CircularProgress />
        ) : error ? (
          <Typography color="error">Erreur : {error.message}</Typography>
        ) : invoice ? (
          <>
            {/* Première ligne : Informations de la facture et relevé */}
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography>
                    <strong>Numéro de Facture :</strong> {invoice.invoiceID}
                  </Typography>
                  <Typography>
                    <strong>Période :</strong> {invoice.record?.period ?? 'N/A'}
                  </Typography>
                  <Typography>
                    <strong>Date de Facturation :</strong>{' '}
                    {formatDate(invoice.createdAt)}
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography>
                    <strong>Date du Relevé :</strong>{' '}
                    {formatDate(invoice.record?.recordDate)}
                  </Typography>
                  <Typography>
                    <strong>Date du Prochain Relevé :</strong>{' '}
                    {formatDate(invoice.record?.nextRecordDate)}
                  </Typography>
                  <Typography>
                    <strong>Ancien Relevé :</strong>{' '}
                    {invoice.record?.oldRecord ?? 'N/A'}
                  </Typography>
                  <Typography>
                    <strong>Nouveau Relevé :</strong>{' '}
                    {invoice.record?.newRecord ?? 'N/A'}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />

            {/* Deuxième ligne : Détails du consommateur et compteur */}
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography>
                    <strong>ID du Consommateur :</strong>{' '}
                    {invoice.consumer?.consumerID ?? 'N/A'}
                  </Typography>
                  <Typography>
                    <strong>Nom du Consommateur :</strong>{' '}
                    {invoice.consumer?.fullName ?? 'N/A'}
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography>
                    <strong>ID du Compteur :</strong>{' '}
                    {invoice?.counter?.counterID ?? 'N/A'}
                  </Typography>
                  <Typography>
                    <strong>Statut :</strong>{' '}
                    {invoice?.counter?.status ?? 'N/A'}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />

            {/* Troisième ligne : Tableau de consommation */}
            <TableContainer component={Paper}>
              <Table className="invoice-table">
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
                    <TableCell align="right">X.XX €</TableCell>{' '}
                    {/* Remplace par le prix réel */}
                    <TableCell align="right">
                      {Number(invoice.amount ?? 0).toFixed(2)} €
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>

            {/* Montant Total */}
            <Typography variant="h6" align="right" sx={{ mt: 2 }}>
              <strong>Montant Total :</strong>{' '}
              {Number(invoice.amount ?? 0).toFixed(2)} €
            </Typography>

            {/* Bouton d'impression (Caché en mode impression) */}
            <div className="invoice-section no-print">
              <Button variant="contained" color="primary" onClick={handlePrint}>
                Imprimer la Facture
              </Button>
            </div>
          </>
        ) : (
          <Typography>Aucune donnée de facture disponible.</Typography>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default InvoiceDetailsModal;
