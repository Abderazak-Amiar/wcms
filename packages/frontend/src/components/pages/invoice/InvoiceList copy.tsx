import { useMutation, useQuery } from '@apollo/client';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import {
  Autocomplete,
  Box,
  Button,
  Checkbox,
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
import { saveAs } from 'file-saver'; // Optional: for saving files in the browser
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import JSZip from 'jszip';
import moment from 'moment';
import 'moment/locale/fr'; // 🇫🇷 importer la locale française

moment.locale('fr'); // ✅ activer le français

import React, { useEffect, useState } from 'react';
import {
  DELETE_INVOICE,
  GET_INVOICES,
  UPDATE_INVOICE_PRINTED,
  getSettings,
} from '../../../api/apollo';
import DeleteConfirmationDialog from '../../molecules/DeleteConfirmationDialog';
import InvoiceDetailsModal from './InvoiceDetailsModal';

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

// Utility function to generate PDF for an invoice

const generateInvoicePDF = (invoice: Invoice, settings: Settings) => {
  const quantityConsumed =
    (invoice?.record?.newRecord ?? 0) - (invoice?.record?.oldRecord ?? 0);
  const doc = new jsPDF();

  // Header Section
  autoTable(doc, {
    body: [
      [
        {
          content: "Facture D'eau",
          styles: {
            halign: 'left',
            fontSize: 20,
            fontStyle: 'bold',
          },
        },
        {
          content: `Village ${
            settings?.getSettings.village?.toUpperCase() ?? ''
          }`,
          styles: {
            halign: 'right',
            fontSize: 20,
            fontStyle: 'bold',
          },
        },
      ],
    ],
    theme: 'plain',
  });

  // Invoice Details Table
  autoTable(doc, {
    body: [
      // Labels Row (Bold)
      [
        {
          content: 'Code Facture:',
          styles: { fontStyle: 'bold', halign: 'center' },
        },
        {
          content: 'Période:',
          styles: { fontStyle: 'bold', halign: 'center' },
        },
        { content: 'Date:', styles: { fontStyle: 'bold', halign: 'center' } },
        { content: 'Status:', styles: { fontStyle: 'bold', halign: 'center' } },
      ],
      // Values Row (Normal)
      [
        { content: invoice?.invoiceID || 'N/A', styles: { halign: 'center' } },
        {
          content: invoice?.record?.period || 'N/A',
          styles: { halign: 'center' },
        },
        {
          content: moment(invoice?.createdAt).format('DD MMM YYYY'),
          styles: { halign: 'center' },
        },
        {
          content: invoice?.isPaid
            ? invoice?.debt?.isPaid === false
              ? 'PP'
              : 'P'
            : 'NP',
          styles: { halign: 'center' },
        },
      ],
    ],
    theme: 'grid',
    styles: { lineColor: [200, 200, 200], lineWidth: 0.5 },
    columnStyles: {
      0: { cellWidth: 'auto' }, // First column (adjust as needed)
      1: { cellWidth: 'auto' }, // Second column
      2: { cellWidth: 'auto' }, // Third column
    },
  });

  autoTable(doc, {
    body: [
      [
        { content: 'Consommateur:', styles: { fontStyle: 'bold' } },
        { content: 'Code consommateur:', styles: { fontStyle: 'bold' } },
      ],
      [invoice?.consumer?.fullName || '', invoice?.consumer?.consumerID || ''],
    ],
    theme: 'grid',
    styles: {
      lineColor: [200, 200, 200], // Light grey borders
      lineWidth: 0.5,
      cellPadding: 5, // Ensures spacing
    },
    didParseCell: function (data) {
      // Apply horizontal border every 2 rows
      const isEvenRow = data.row.index % 2 === 1; // 1, 3, 5 (second row of each group)

      data.cell.styles.lineWidth = {
        top: 0, // No top border
        bottom: isEvenRow ? 0.5 : 0, // Add bottom border only every 2 rows
        left: 0.5, // Keep left border
        right: 0.5, // Keep right border
      };
    },
  });
  autoTable(doc, {
    body: [
      [
        { content: 'Date Relevé:', styles: { fontStyle: 'bold' } },
        { content: 'Prochain Relevé:', styles: { fontStyle: 'bold' } },
        { content: 'Ancien Relevé:', styles: { fontStyle: 'bold' } },
        { content: 'Nouveau Relevé:', styles: { fontStyle: 'bold' } },
      ],
      [
        moment(invoice?.record?.recordDate).format('DD MMM YYYY'),
        moment(invoice?.record?.nextRecordDate).format('DD MMM YYYY'),
        `${invoice?.record?.oldRecord} m³` || '',
        `${invoice?.record?.newRecord} m³` || '',
      ],
    ],
    theme: 'grid',
    styles: {
      lineColor: [200, 200, 200], // Light grey borders
      lineWidth: 0.5,
      cellPadding: 5, // Ensures spacing
    },
    didParseCell: function (data) {
      // Apply horizontal border every 2 rows
      const isEvenRow = data.row.index % 2 === 1; // 1, 3, 5 (second row of each group)

      data.cell.styles.lineWidth = {
        top: 0, // No top border
        bottom: isEvenRow ? 0.5 : 0, // Add bottom border only every 2 rows
        left: 0.5, // Keep left border
        right: 0.5, // Keep right border
      };
    },
  });
  autoTable(doc, {
    body: [
      [
        { content: 'Numéro Compteur:', styles: { fontStyle: 'bold' } },
        { content: 'Statut:', styles: { fontStyle: 'bold' } },
      ],
      [invoice?.counter?.counterID || '', invoice?.counter?.status || ''],
    ],
    theme: 'grid',
    styles: {
      lineColor: [200, 200, 200], // Light grey borders
      lineWidth: 0.5,
      cellPadding: 5, // Ensures spacing
    },
    didParseCell: function (data) {
      // Apply horizontal border every 2 rows
      const isEvenRow = data.row.index % 2 === 1; // 1, 3, 5 (second row of each group)

      data.cell.styles.lineWidth = {
        top: 0, // No top border
        bottom: isEvenRow ? 0.5 : 0, // Add bottom border only every 2 rows
        left: 0.5, // Keep left border
        right: 0.5, // Keep right border
      };
    },
  });

  autoTable(doc, {
    body: [
      [
        { content: 'Quantité Consommée', styles: { fontStyle: 'bold' } },
        { content: 'Prix Unitaire', styles: { fontStyle: 'bold' } },
        { content: 'Total', styles: { fontStyle: 'bold' } },
      ],
      [
        `${quantityConsumed.toString()} m³`,
        `${Number(settings?.getSettings.m3price ?? 0).toFixed(2)} DA/m³`,
        Number(invoice?.amount ?? 0).toFixed(2) + ' DA',
      ],
    ],
    theme: 'grid',
    styles: { lineColor: [200, 200, 200], lineWidth: 0.5 },
  });

  // Total Amount
  autoTable(doc, {
    body: [
      [
        { content: 'Due', styles: { fontStyle: 'bold' } },
        { content: 'Payé', styles: { fontStyle: 'bold' } },
      ],
      [
        { content: invoice?.amount + ' DA', styles: { halign: 'left' } },
        {
          content:
            invoice?.isPaid && !invoice?.debt?.isPaid
              ? (
                  Number(invoice?.amount) - Number(invoice?.debt?.amount)
                ).toFixed(2)
              : '0 DA',
          styles: { halign: 'left' },
        },
      ],
    ],
    theme: 'grid',
    styles: { lineColor: [200, 200, 200], lineWidth: 0.5 },
  });
  autoTable(doc, {
    body: [
      [
        { content: 'Dette', styles: { fontStyle: 'bold' } },
        { content: 'Date', styles: { fontStyle: 'bold' } },
      ],
      [
        `${invoice?.debt?.amount ?? '0'} DA`,
        `${moment(invoice?.debt?.createdAt).format('DD MMM YYYY')}`,
      ],
    ],
    theme: 'grid',
    styles: { lineColor: [200, 200, 200], lineWidth: 0.5 },
  });
  // Terms & Notes
  autoTable(doc, {
    body: [
      [
        {
          content: 'Note',
          styles: { halign: 'left', fontSize: 14, fontStyle: 'bold' },
        },
        {
          content: 'Indication',
          styles: { halign: 'left', fontSize: 14, fontStyle: 'bold' },
        },
      ],
      [
        {
          content: `Veuillez, s'il vous plaît, vous approcher du bureau du comité du village\nafin de payer votre facture avant le ${moment(
            invoice?.createdAt,
          )
            .add(settings.getSettings.deadline, 'days')
            .format(
              'DD MMM YYYY',
            )}.\nNous vous remercions pour votre fidélité.`,
          styles: { halign: 'left', fontStyle: 'bolditalic' },
        },
        {
          content: 'Payée (P)\nPartielement Payée (PP)\nNon Payée (NP)',
          styles: { halign: 'left', fontStyle: 'bolditalic' },
        },
      ],
    ],
    theme: 'grid',
    styles: { lineColor: [200, 200, 200], lineWidth: 0.5 },
  });
  // Footer
  autoTable(doc, {
    body: [
      [
        {
          content: '',
          styles: { halign: 'center', fontSize: 12, fontStyle: 'bold' },
        },
      ],
    ],
    theme: 'plain',
  });

  return doc;
};

const InvoiceList: React.FC = () => {
  const [isPrintedFilter, setIsPrintedFilter] = useState<
    boolean | 'all' | string
  >('all');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null);
  const [consumerFilter, setConsumerFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'P' | 'PP' | 'NP'>(
    'all',
  );

  const [periodFilter, setPeriodFilter] = useState<string>('all');
  const [dateRangeFilter, setDateRangeFilter] = useState<{
    start: string;
    end: string;
  }>({
    start: '',
    end: '',
  });
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
  // Fetch invoices
  const { refetch, loading, error, data } = useQuery<{ invoices: Invoice[] }>(
    GET_INVOICES,
  );
  console.log('==>data', data);
  // Fetch Settings
  const {
    loading: loadingSettings,
    error: errorSettings,
    data: dataSettings,
  } = useQuery<Settings>(getSettings);
  console.log('==>dataSettings', dataSettings?.getSettings);
  useEffect(() => {
    refetch();
  }, [refetch]);

  console.log('==>invoice', data);

  // Filters state

  // Period options
  const periodOptions = ['Jan - Mar', 'Apr - Jun', 'Jul - Sep', 'Oct - Dec'];

  // Mutations

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

  // const handlePrintInvoices = async () => {
  //   if (selectedInvoices.length === 0) return;

  //   const zip = new JSZip();

  //   await Promise.all(
  //     selectedInvoices.map(async (invoiceID) => {
  //       const invoice = data?.invoices?.find(
  //         (inv) => inv.invoiceID === invoiceID,
  //       );
  //       if (!invoice) return;
  //       if (!dataSettings) return;
  //       const doc = generateInvoicePDF(invoice, dataSettings);
  //       const pdfBlob = doc.output('blob');
  //       zip.file(`Facture_${invoice.invoiceID}.pdf`, pdfBlob);
  //       await updateInvoicePrinted({ variables: { invoiceID } });
  //     }),
  //   );

  //   const zipBlob = await zip.generateAsync({ type: 'blob' });

  //   // Save the ZIP file using Electron's file save dialog
  //   if (window.electron) {
  //     window.electron.savePDFs(zipBlob);
  //   } else {
  //     // Fallback for browser environment
  //     saveAs(zipBlob, 'invoices.zip');
  //   }

  //   setSelectedInvoices([]);
  //   refetch();
  // };

  // Filter invoices based on filter criteria
  const handlePrintInvoices = async () => {
    if (selectedInvoices.length === 0) return;

    const zip = new JSZip();

    // Filter selected invoices based on current filters
    const filteredInvoices = data?.invoices?.filter((invoice) => {
      if (!selectedInvoices.includes(invoice.invoiceID)) return false;

      // Apply the same filtering logic
      if (statusFilter === 'P' && !invoice.isPaid) return false;
      if (
        statusFilter === 'PP' &&
        (!invoice.debt || invoice.isPaid || invoice.debt.isPaid)
      )
        return false;
      if (statusFilter === 'NP' && invoice.isPaid) return false;

      if (
        consumerFilter &&
        !invoice.consumer.fullName
          .toLowerCase()
          .includes(consumerFilter.toLowerCase())
      ) {
        return false;
      }

      if (dateRangeFilter.start && dateRangeFilter.end) {
        const invoiceDate = moment(invoice.createdAt);
        const startDate = moment(dateRangeFilter.start);
        const endDate = moment(dateRangeFilter.end);
        if (!invoiceDate.isBetween(startDate, endDate, undefined, '[]')) {
          return false;
        }
      }

      if (periodFilter !== 'all' && invoice.record.period !== periodFilter) {
        return false;
      }

      if (isPrintedFilter !== 'all' && invoice.isPrinted !== isPrintedFilter) {
        return false;
      }

      return true;
    });

    console.log('Filtered Invoices:', filteredInvoices); // ✅ Print the filtered invoices

    if (!filteredInvoices || filteredInvoices.length === 0) {
      console.log('No invoices match the selected filters.');
      return;
    }

    await Promise.all(
      filteredInvoices.map(async (invoice) => {
        if (!dataSettings) return;
        const doc = generateInvoicePDF(invoice, dataSettings);
        const pdfBlob = doc.output('blob');
        zip.file(`Facture_${invoice.invoiceID}.pdf`, pdfBlob);
        await updateInvoicePrinted({
          variables: { invoiceID: invoice.invoiceID },
        });
      }),
    );

    const zipBlob = await zip.generateAsync({ type: 'blob' });

    // Save the ZIP file using Electron's file save dialog
    if (window.electron) {
      // @ts-expect-error Property 'savePDFs' does not exist on type 'window.electron'
      window.electron.savePDFs(zipBlob);
    } else {
      saveAs(zipBlob, 'invoices.zip');
    }

    setSelectedInvoices([]);
    refetch();
  };

  console.log('==>dataa', data);
  const filteredInvoices = data?.invoices?.filter((invoice, index) => {
    console.log('==>invoice?.debt?.isPaid', invoice?.debt?.isPaid, index);
    // Filter by status

    if (statusFilter === 'P' && !(invoice.isPaid && invoice?.debt?.isPaid))
      return false;
    if (statusFilter === 'PP' && !(invoice.isPaid && !invoice?.debt?.isPaid))
      return false;

    if (statusFilter === 'NP' && invoice.isPaid) return false;

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
    if (isPrintedFilter !== 'all' && invoice.isPrinted !== isPrintedFilter) {
      return false;
    }

    return true;
  });

  if (loading) return <Typography>Loading...</Typography>;
  if (error)
    return <Typography color="error">Error: {error.message}</Typography>;
  if (loadingSettings) return <Typography>Loading...</Typography>;
  if (errorSettings)
    return (
      <Typography color="error">Error: {errorSettings.message}</Typography>
    );
  const options = [
    { label: 'Tous', value: 'all' },
    { label: 'Imprimé', value: true },
    { label: 'Non Imprimé', value: false },
  ];
  return (
    <Box
      sx={{
        background: 'linear-gradient(135deg, #f5f7fa, #c3cfe2)',
        padding: 3,
      }}
    >
      {/* Filters Section */}

      <Paper sx={{ padding: 2, marginBottom: 3 }}>
        <Typography variant="h6" gutterBottom>
          Filtres
        </Typography>
        <Grid container spacing={2}>
          {/* Statut Filter */}
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth variant="outlined" size="small">
              <InputLabel>Statut</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as 'all' | 'P' | 'PP' | 'NP')
                }
                label="Statut"
              >
                <MenuItem value="all">Tous</MenuItem>
                <MenuItem value="P">Payé</MenuItem>
                <MenuItem value="PP">Partielement Payé</MenuItem>
                <MenuItem value="NP">Non Payé</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Consumer Filter */}
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

          {/* Period Filter */}
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

          {/* Date Range Filters */}
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

          {/* isPrinted Filter */}
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth variant="outlined" size="small">
              <Autocomplete
                value={
                  options.find((option) => option.value === isPrintedFilter) ||
                  null
                }
                onChange={(_, newValue) =>
                  setIsPrintedFilter(newValue?.value ?? 'all')
                }
                options={options}
                getOptionLabel={(option) => option.label}
                renderInput={(params) => (
                  <TextField {...params} label="Imprimé" />
                )}
              />
              ;
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Invoices Table */}
      <Paper sx={{ padding: 2 }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ '& th': { fontWeight: 'bold !important' } }}>
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
                    <TableCell>{item?.invoiceID.substring(0, 8)}</TableCell>
                    <TableCell>{item?.consumer?.fullName}</TableCell>
                    <TableCell>{item?.amount}</TableCell>
                    <TableCell>{item?.record?.period}</TableCell>
                    <TableCell>
                      {item?.isPaid
                        ? item?.debt?.isPaid === false
                          ? 'PP'
                          : 'P'
                        : 'NP'}
                    </TableCell>
                    <TableCell>
                      {moment(item.createdAt).format('DD MMM YYYY')}
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
            labelRowsPerPage="Lignes par page"
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
      {selectedInvoice && dataSettings && (
        <InvoiceDetailsModal
          invoiceID={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          settings={dataSettings}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        message="Êtes-vous sûr de vouloir supprimer cette facture ? Cette action est
          irréversible."
      />
    </Box>
  );
};

export default InvoiceList;
