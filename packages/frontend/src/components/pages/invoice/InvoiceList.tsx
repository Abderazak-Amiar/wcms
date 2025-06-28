import { useApolloClient, useMutation, useQuery } from '@apollo/client';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
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
  Tooltip,
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
  getDebtsByConsumer,
  getSettings,
} from '../../../api/apollo';
import { getCurrentTrimesterFr } from '../../../helpers/getCurrentTrimester';
import DeleteConfirmationDialog from '../../molecules/DeleteConfirmationDialog';
import { EditInvoiceModal } from './EditInvoiceModal';
import InvoiceDetailsModal from './InvoiceDetailsModal';

export type Invoice = {
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
    recordID: string;
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
    subscription: string;
    tax: string;
  };
};
type Debt = {
  invoiceID: string;
  amount: string;
  isPaid: boolean;
  createdAt: string;
};
// Utility function to generate PDF for an invoice
declare module 'jspdf' {
  interface jsPDF {
    lastAutoTable?: { finalY?: number };
  }
}
const generateInvoicePDF = (
  invoice: Invoice,
  settings: Settings,
  debts: Debt[],
) => {
  const quantityConsumed =
    (invoice?.record?.newRecord ?? 0) - (invoice?.record?.oldRecord ?? 0);
  const doc = new jsPDF();
  console.log('==>debts', debts);
  // Header Section
  console.log('====>>settings', settings);
  autoTable(doc, {
    body: [
      [
        {
          content: "Facture D'eau",
          styles: {
            halign: 'left',
            fontSize: 20,
            fontStyle: 'bold',
            textColor: [80, 80, 80], // Light gray color
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
            textColor: [100, 100, 100], // Slightly lighter gray color
          },
        },
      ],
      [
        {
          content: `Téléphone: ${settings?.getSettings.phone ?? ''}`,
          styles: {
            halign: 'left',
            fontSize: 10,
            textColor: [100, 100, 100], // Light gray color
          },
        },
        {
          content: `Email: ${settings?.getSettings.email ?? ''}`,
          styles: {
            halign: 'right',
            fontSize: 10,
            textColor: [100, 100, 100], // Light gray color
          },
        },
      ],
    ],
    theme: 'plain',
    startY: (doc.lastAutoTable?.finalY ?? 10) + 5,
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
    startY: (doc.lastAutoTable?.finalY ?? 10) + 5,
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
    startY: (doc.lastAutoTable?.finalY ?? 10) + 5,
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
    startY: (doc.lastAutoTable?.finalY ?? 10) + 5,
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
    startY: (doc.lastAutoTable?.finalY ?? 10) + 5,
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
    startY: (doc.lastAutoTable?.finalY ?? 10) + 5,
    styles: { lineColor: [200, 200, 200], lineWidth: 0.5 },
  });

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
    startY: (doc.lastAutoTable?.finalY ?? 10) + 5,
    theme: 'grid',
    styles: { lineColor: [200, 200, 200], lineWidth: 0.5 },
  });
  const visibleDebts = debts.filter((debt) => Number(debt.amount) > 0);
  if (visibleDebts.length > 0) {
    autoTable(doc, {
      head: [['Factures en Dette', 'Montant', 'Date']],
      body: visibleDebts.map((debt) => [
        debt.invoiceID?.substring(0, 8) || 'N/A',
        `${debt.amount} DA`,
        moment(debt.createdAt).format('DD MMM YYYY'),
      ]),
      startY: (doc.lastAutoTable?.finalY ?? 10) + 5, // Reduced space between tables
      theme: 'grid',
      styles: {
        lineColor: [200, 200, 200],
        lineWidth: 0.5,
      },
      headStyles: {
        fillColor: false,
        textColor: [80, 80, 80], // Same text color as other titles
        halign: 'center',
        fontSize: 10,
      },
    });
  }
  // Total Amount
  // Abonnement & Taxe & Montant Total
  autoTable(doc, {
    body: [
      [
        {
          content: 'Abonnement:',
          styles: { fontStyle: 'bold', halign: 'left' },
        },
        {
          content: `${Number(settings.getSettings.subscription).toFixed(2)} DA`,
          styles: { halign: 'left' },
        },
      ],
      [
        {
          content: 'Taxe de collecte des déchets ménagers:',
          styles: { fontStyle: 'bold', halign: 'left' },
        },
        {
          content: `${Number(settings.getSettings.tax).toFixed(2)} DA`,
          styles: { halign: 'left' },
        },
      ],
      [
        {
          content: 'Montant total:',
          styles: { fontStyle: 'bold', halign: 'right' },
        },
        {
          content:
            invoice?.isPaid && invoice?.debt && !invoice?.debt?.isPaid
              ? (
                  Number(invoice?.debt?.amount) +
                  Number(settings.getSettings.subscription) +
                  Number(settings.getSettings.tax)
                ).toFixed(2) + ' DA'
              : (
                  Number(invoice?.amount) +
                  Number(settings.getSettings.subscription) +
                  Number(settings.getSettings.tax)
                ).toFixed(2) + ' DA',
          styles: { fontStyle: 'bold', halign: 'right' },
        },
      ],
    ],
    theme: 'grid',
    startY: (doc.lastAutoTable?.finalY ?? 10) + 5,
    styles: { lineColor: [200, 200, 200], lineWidth: 0.5 },
  });
  // Terms & Notes
  autoTable(doc, {
    body: [
      [
        {
          content: `Veuillez, s'il vous plaît, vous approcher du bureau du comité du village\nafin de payer votre facture avant le ${moment(
            invoice?.createdAt,
          )
            .add(settings.getSettings.deadline, 'days')
            .format(
              'DD MMM YYYY',
            )}.\nNous vous remercions pour votre fidélité.`,
          styles: { halign: 'left', fontSize: 10, fontStyle: 'italic' },
        },
      ],
    ],
    theme: 'plain',
    styles: { lineColor: [200, 200, 200], lineWidth: 0.5 },
  });
  // Footer
  autoTable(doc, {
    body: [
      [
        {
          content: 'Développé par Ing. Logiciel Abderazak Amiar',
          styles: {
            halign: 'center',
            fontSize: 10,
            textColor: [150, 150, 150],
          },
        },
      ],
    ],
    theme: 'plain',
    startY: (doc.lastAutoTable?.finalY ?? 10) + 5,
  });

  return doc;
};

const InvoiceList: React.FC = () => {
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  console.log('==>');
  const client = useApolloClient();
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
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const handleCopy = async (id: string) => {
    try {
      await navigator.clipboard.writeText(id);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 5000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };
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

        // ✅ Fetch debts of the consumer
        const { data: consumerDebtData } = await client.query({
          query: getDebtsByConsumer,
          variables: { consumerID: invoice.consumer.consumerID },
          fetchPolicy: 'network-only',
        });

        const debts = consumerDebtData?.getDebtsByConsumer || [];
        console.log('==>debts', debts);

        const doc = generateInvoicePDF(invoice, dataSettings, debts);
        const pdfBlob = doc.output('blob');
        zip.file(
          `${invoice?.invoiceID}_${invoice?.consumer?.fullName}_${invoice?.record?.period}.pdf`,
          pdfBlob,
        );

        await updateInvoicePrinted({
          variables: { invoiceID: invoice.invoiceID },
        });
      }),
    );
    const zipArrayBuffer = await zip.generateAsync({ type: 'arraybuffer' });
    const zipFileName = `${getCurrentTrimesterFr()}_${new Date().getFullYear()}.zip`;

    if (window.electron) {
      // Electron — send raw buffer + filename
      // @ts-expect-error: custom API exposed in preload
      window.electron.savePDFs(
        new Blob([zipArrayBuffer], { type: 'application/zip' }),
        zipFileName,
      );
    } else {
      // Browser — wrap buffer in a real Blob
      const blob = new Blob([zipArrayBuffer], { type: 'application/zip' });
      saveAs(blob, zipFileName);
    }

    setSelectedInvoices([]);
    refetch();
  };

  const filteredInvoices = data?.invoices?.filter((invoice) => {
    const isPaid = invoice?.isPaid === true;
    const debt = invoice?.debt;
    const isDebtPaid = debt?.isPaid === true;
    const hasDebt = debt !== null;

    // Filter by status
    if (statusFilter === 'P') {
      if (!(isPaid && (!hasDebt || isDebtPaid))) return false;
    }

    if (statusFilter === 'PP') {
      if (!(isPaid && hasDebt && !isDebtPaid)) return false;
    }

    if (statusFilter === 'NP') {
      if (isPaid) return false;
    }

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

    // Filter by print status
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
                    <Tooltip
                      title={
                        copiedId === item.invoiceID
                          ? 'Copié'
                          : 'Cliquer pour copier'
                      }
                      arrow
                    >
                      <TableCell
                        onClick={() => handleCopy(item?.invoiceID)}
                        sx={{
                          fontFamily: 'monospace',
                          cursor: 'pointer',
                          userSelect: 'none',
                          '&:hover': {
                            fontWeight: 'bold',
                          },
                        }}
                      >
                        {item?.invoiceID.substring(0, 8)}
                      </TableCell>
                    </Tooltip>
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
                        onClick={() => {
                          setSelectedInvoice(item.invoiceID);
                          refetch(); // Refresh the data when an invoice is selected
                        }}
                      >
                        <VisibilityIcon />
                      </IconButton>
                      <IconButton
                        onClick={() => handleDeleteConfirm(item.invoiceID)}
                      >
                        <DeleteIcon />
                      </IconButton>
                      <IconButton
                        aria-label="Modifier"
                        onClick={() => {
                          setEditingInvoice(item);
                          setEditModalOpen(true);
                        }}
                      >
                        <EditIcon />
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

      {selectedInvoice && dataSettings && (
        <InvoiceDetailsModal
          invoiceID={selectedInvoice}
          onClose={() => {
            setSelectedInvoice(null);
            refetch(); // Refresh the data when the modal is closed
          }}
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
      <EditInvoiceModal
        invoice={editingInvoice}
        open={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setEditingInvoice(null);
        }}
      />
    </Box>
  );
};

export default InvoiceList;
