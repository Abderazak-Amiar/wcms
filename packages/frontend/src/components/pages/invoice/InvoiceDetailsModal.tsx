import { useQuery } from '@apollo/client';
import {
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
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

  return (
    <Dialog open={!!invoiceID} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Invoice Details</DialogTitle>
      <DialogContent>
        {loading ? (
          <CircularProgress />
        ) : error ? (
          <Typography color="error">Error: {error.message}</Typography>
        ) : invoice ? (
          <>
            {/* Invoice Information */}
            <Typography>
              <strong>Invoice ID:</strong> {invoice.invoiceID}
            </Typography>
            <Typography>
              <strong>Customer:</strong> {invoice.customerName}
            </Typography>
            <Typography>
              <strong>Address:</strong> {invoice.customerAddress}
            </Typography>
            <Typography>
              <strong>Issue Date:</strong>{' '}
              {new Date(invoice.issueDate).toLocaleDateString()}
            </Typography>
            <Typography>
              <strong>Due Date:</strong>{' '}
              {invoice.dueDate
                ? new Date(invoice.dueDate).toLocaleDateString()
                : 'N/A'}
            </Typography>
            <Typography>
              <strong>Paid:</strong> {invoice.isPaid ? 'Yes' : 'No'}
            </Typography>

            <Divider sx={{ my: 2 }} />

            {/* Invoice Items Table */}
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <strong>Description</strong>
                    </TableCell>
                    <TableCell align="right">
                      <strong>Quantity</strong>
                    </TableCell>
                    <TableCell align="right">
                      <strong>Unit Price</strong>
                    </TableCell>
                    <TableCell align="right">
                      <strong>Total</strong>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {invoice.items && invoice.items.length > 0 ? (
                    invoice.items.map((item: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell>{item.description}</TableCell>
                        <TableCell align="right">
                          {item.quantity || 0}
                        </TableCell>
                        <TableCell align="right">
                          ${(item.unitPrice ?? 0).toFixed(2)}
                        </TableCell>
                        <TableCell align="right">
                          $
                          {(
                            (item.quantity ?? 0) * (item.unitPrice ?? 0)
                          ).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        No items available
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Total Amount */}
            <Typography variant="h6" align="right" sx={{ mt: 2 }}>
              <strong>Total Amount:</strong> $
              {(invoice.totalAmount ?? 0).toFixed(2)}
            </Typography>
          </>
        ) : (
          <Typography>No invoice details available.</Typography>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default InvoiceDetailsModal;
