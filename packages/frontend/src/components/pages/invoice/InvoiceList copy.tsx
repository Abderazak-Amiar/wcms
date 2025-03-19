import { useMutation, useQuery } from '@apollo/client';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import moment from 'moment';
import React, { useEffect, useState } from 'react';
import {
  DELETE_INVOICE,
  GET_INVOICES,
  UPDATE_INVOICE_PRINTED,
} from '../../../api/apollo';
import InvoiceDetailsModal from './InvoiceDetailsModal';

interface Invoice {
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
  };
}

// Utility function to generate PDF for an invoice
const generateInvoicePDF = (invoice: Invoice) => {
  const doc = new jsPDF();
  doc.text(`Facture ID: ${invoice.invoiceID}`, 10, 10);
  doc.text(`Date: ${moment(invoice.createdAt).format('DD-MMM-YYYY')}`, 10, 20);
  doc.text(`Montant: ${invoice.amount} DA`, 10, 30);
  doc.text(`Consommateur: ${invoice.consumer.fullName}`, 10, 40);
  autoTable(doc, {
    startY: 50,
    head: [['Période', 'Ancien relevé', 'Nouveau relevé']],
    body: [
      [
        invoice.record.period,
        invoice.record.oldRecord,
        invoice.record.newRecord,
      ],
    ],
  });
  return doc;
};

// Delete Confirmation Dialog Component
const DeleteConfirmationDialog: React.FC<{
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}> = ({ open, onClose, onConfirm }) => (
  <Dialog open={open} onClose={onClose}>
    <DialogTitle>Confirmer la suppression</DialogTitle>
    <DialogContent>
      <DialogContentText>
        Êtes-vous sûr de vouloir supprimer cette facture ? Cette action est
        irréversible.
      </DialogContentText>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose} color="primary">
        Annuler
      </Button>
      <Button onClick={onConfirm} color="error">
        Supprimer
      </Button>
    </DialogActions>
  </Dialog>
);

const InvoiceList: React.FC = () => {
  // Fetch invoices
  const { refetch, loading, error, data } = useQuery<{ invoices: Invoice[] }>(
    GET_INVOICES,
  );
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null);

  // Filters state
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'unpaid'>(
    'all',
  );
  const [consumerFilter, setConsumerFilter] = useState<string>('');
  const [dateRangeFilter, setDateRangeFilter] = useState<{
    start: string;
    end: string;
  }>({
    start: '',
    end: '',
  });
  const [periodFilter, setPeriodFilter] = useState<string>('all');

  // Period options
  const periodOptions = ['Jan - Mar', 'Apr - Jun', 'Jul - Sep', 'Oct - Dec'];

  // Mutations
  const [deleteInvoice] = useMutation(DELETE_INVOICE, {
    update(cache, { data }) {
      if (data?.deleteInvoice) {
        cache.modify({
          fields: {
            invoices(existingInvoices = []) {
              return existingInvoices.filter(
                (invoice: Invoice) => invoice.invoiceID !== deleteTarget,
              );
            },
          },
        });
      }
    },
    onError(err) {
      console.error('Delete error:', err);
    },
  });

  const [updateInvoicePrinted] = useMutation(UPDATE_INVOICE_PRINTED);

  // Handle selection
  const handleSelect = (id: string) => {
    setSelectedInvoices((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  // Select all invoices for printing
  const handleSelectAll = () => {
    if (selectedInvoices.length === data?.invoices?.length) {
      setSelectedInvoices([]);
    } else {
      setSelectedInvoices(
        data?.invoices?.map((invoice) => invoice.invoiceID) || [],
      );
    }
  };

  // Delete confirmation
  const handleDeleteConfirm = (invoiceID: string) => {
    setDeleteTarget(invoiceID);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteInvoice({ variables: { invoiceID: deleteTarget } });
      setDeleteTarget(null);
      refetch();
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  // Generate and download invoices
  const handlePrintInvoices = async () => {
    if (selectedInvoices.length === 0) return;

    await Promise.all(
      selectedInvoices.map(async (invoiceID) => {
        const invoice = data?.invoices?.find(
          (inv) => inv.invoiceID === invoiceID,
        );
        if (!invoice) return;

        const doc = generateInvoicePDF(invoice);
        doc.save(`Facture_${invoice.invoiceID}.pdf`);

        await updateInvoicePrinted({ variables: { invoiceID } });
      }),
    );

    setSelectedInvoices([]);
    refetch();
  };

  // Filter invoices based on filter criteria
  const filteredInvoices = data?.invoices?.filter((invoice) => {
    // Filter by status
    if (statusFilter === 'paid' && !invoice.isPaid) return false;
    if (statusFilter === 'unpaid' && invoice.isPaid) return false;

    // Filter by consumer name
    if (
      consumerFilter &&
      !invoice.consumer.fullName
        .toLowerCase()
        .includes(consumerFilter.toLowerCase())
    ) {
      return false;
    }

    // Filter by date range
    if (dateRangeFilter.start && dateRangeFilter.end) {
      const invoiceDate = moment(invoice.createdAt);
      const startDate = moment(dateRangeFilter.start);
      const endDate = moment(dateRangeFilter.end);
      if (!invoiceDate.isBetween(startDate, endDate, undefined, '[]')) {
        return false;
      }
    }

    // Filter by period
    if (periodFilter !== 'all' && invoice.record.period !== periodFilter) {
      return false;
    }

    return true;
  });

  useEffect(() => {
    refetch();
  }, [refetch]);

  if (loading) return <Typography>Loading...</Typography>;
  if (error)
    return <Typography color="error">Error: {error.message}</Typography>;

  return (
    <Box sx={{ padding: 3 }}>
      {/* Filters Section */}
      <Paper sx={{ padding: 2, marginBottom: 3 }}>
        <Typography variant="h6" gutterBottom>
          Filters
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth variant="outlined" size="small">
              <InputLabel>Statut</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as 'all' | 'paid' | 'unpaid')
                }
                label="Statut"
              >
                <MenuItem value="all">Tous</MenuItem>
                <MenuItem value="paid">Payé</MenuItem>
                <MenuItem value="unpaid">Non Payé</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              label="Consommateur"
              variant="outlined"
              size="small"
              value={consumerFilter}
              onChange={(e) => setConsumerFilter(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={2}>
            <FormControl fullWidth variant="outlined" size="small">
              <InputLabel>Période</InputLabel>
              <Select
                value={periodFilter}
                onChange={(e) => setPeriodFilter(e.target.value)}
                label="Période"
              >
                <MenuItem value="all">Tous</MenuItem>
                {periodOptions.map((period) => (
                  <MenuItem key={period} value={period}>
                    {period}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={2}>
            <TextField
              fullWidth
              label="Date de début"
              type="date"
              variant="outlined"
              size="small"
              InputLabelProps={{ shrink: true }}
              value={dateRangeFilter.start}
              onChange={(e) =>
                setDateRangeFilter({
                  ...dateRangeFilter,
                  start: e.target.value,
                })
              }
            />
          </Grid>
          <Grid item xs={12} sm={2}>
            <TextField
              fullWidth
              label="Date de fin"
              type="date"
              variant="outlined"
              size="small"
              InputLabelProps={{ shrink: true }}
              value={dateRangeFilter.end}
              onChange={(e) =>
                setDateRangeFilter({ ...dateRangeFilter, end: e.target.value })
              }
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Invoices Table */}
      <Paper sx={{ padding: 2 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>
                  <Checkbox
                    checked={
                      selectedInvoices.length === filteredInvoices?.length &&
                      selectedInvoices.length > 0
                    }
                    indeterminate={
                      selectedInvoices.length > 0 &&
                      selectedInvoices.length < (filteredInvoices?.length || 0)
                    }
                    onChange={handleSelectAll}
                  />
                </TableCell>
                <TableCell>N° Facture</TableCell>
                <TableCell>Consommateur</TableCell>
                <TableCell>Montant</TableCell>
                <TableCell>Période</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredInvoices
                ?.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((item) => (
                  <TableRow key={item.invoiceID}>
                    <TableCell>
                      <Checkbox
                        checked={selectedInvoices.includes(item.invoiceID)}
                        onChange={() => handleSelect(item.invoiceID)}
                      />
                    </TableCell>
                    <TableCell>{item.invoiceID.substring(0, 8)}</TableCell>
                    <TableCell>{item.consumer.fullName}</TableCell>
                    <TableCell>{item.amount}</TableCell>
                    <TableCell>{item.record.period}</TableCell>
                    <TableCell>
                      {item?.isPaid
                        ? item?.debt?.isPaid === false
                          ? 'PP'
                          : 'P'
                        : 'NP'}
                    </TableCell>
                    <TableCell>
                      {moment(item.createdAt).format('DD-MMM-YYYY')}
                    </TableCell>
                    <TableCell>
                      <IconButton
                        onClick={() => setSelectedInvoice(item.invoiceID)}
                      >
                        <VisibilityIcon />
                      </IconButton>
                      <IconButton
                        onClick={() => handleDeleteConfirm(item.invoiceID)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
        {filteredInvoices && (
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredInvoices.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            onRowsPerPageChange={(event) => {
              setRowsPerPage(parseInt(event.target.value, 10));
              setPage(0);
            }}
          />
        )}
      </Paper>

      {/* Print Button */}
      <Box sx={{ marginTop: 2 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={handlePrintInvoices}
          disabled={selectedInvoices.length === 0}
        >
          Imprimer Sélection
        </Button>
      </Box>

      {/* Invoice Details Modal */}
      {selectedInvoice && (
        <InvoiceDetailsModal
          invoiceID={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </Box>
  );
};

export default InvoiceList;
