import { useMutation, useQuery } from '@apollo/client';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
} from '@mui/material';
import moment from 'moment';
import React, { useCallback, useEffect, useState } from 'react';
import { DELETE_INVOICE, GET_INVOICES } from '../../../api/apollo';
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
}

const InvoiceList: React.FC = () => {
  // Fetch invoices
  const { refetch, loading, error, data } = useQuery<{ invoices: Invoice[] }>(
    GET_INVOICES,
  );
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  console.log('==>GET_INVOICES', data);
  // Delete mutation
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

  // State for selected invoices and pagination
  const [selected, setSelected] = useState<string[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null);

  const handleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleDeleteConfirm = (invoiceID: string) => {
    setDeleteTarget(invoiceID);
  };

  const handleDelete = async () => {
    if (deleteTarget) {
      try {
        await deleteInvoice({ variables: { invoiceID: deleteTarget } });
      } catch (err) {
        console.error('Delete error:', err);
      } finally {
        setDeleteTarget(null);
      }
    }
  };

  const stableRefetch = useCallback(() => {
    refetch();
  }, [refetch]);

  useEffect(() => {
    stableRefetch();
  }, [stableRefetch]); // ✅ No ESLint warning
  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Select</TableCell>
              <TableCell>N° Facture</TableCell>
              <TableCell>Consomateur</TableCell>
              <TableCell>Montant</TableCell>
              <TableCell>Période</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data?.invoices
              ?.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((item) => (
                <TableRow key={item?.invoiceID}>
                  <TableCell>
                    <Checkbox
                      checked={selected.includes(item?.invoiceID)}
                      onChange={() => handleSelect(item?.invoiceID)}
                    />
                  </TableCell>
                  <TableCell>{item?.invoiceID.substring(0, 8)}</TableCell>
                  <TableCell>{item?.consumer?.fullName}</TableCell>
                  <TableCell>{item?.amount}</TableCell>
                  <TableCell>{item?.record?.period}</TableCell>
                  <TableCell>{item?.isPaid ? 'P' : 'NP'}</TableCell>
                  <TableCell>
                    {moment(item?.createdAt).format('DD-MMM-YYYY')}
                  </TableCell>
                  <TableCell>
                    <IconButton
                      onClick={() => setSelectedInvoice(item?.invoiceID)}
                    >
                      <VisibilityIcon />
                    </IconButton>
                    <IconButton
                      onClick={() => handleDeleteConfirm(item?.invoiceID)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
        {data && data?.invoices?.length > 0 && (
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={data?.invoices?.length || 0}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            onRowsPerPageChange={(event) => {
              setRowsPerPage(parseInt(event.target.value, 10));
              setPage(0);
            }}
          />
        )}
      </TableContainer>

      {selectedInvoice && (
        <InvoiceDetailsModal
          invoiceID={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
        />
      )}

      {/* Deletion Confirmation Dialog */}
      <Dialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
      >
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Êtes-vous sûr de vouloir supprimer cette facture ? Cette action est
            irréversible.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)} color="primary">
            Annuler
          </Button>
          <Button onClick={handleDelete} color="error" autoFocus>
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default InvoiceList;
