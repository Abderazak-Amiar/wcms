import { useQuery } from '@apollo/client';
import {
  Alert,
  Autocomplete,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useFormik } from 'formik';
import moment from 'moment';
import { enqueueSnackbar } from 'notistack';
import { useEffect, useState } from 'react';
import * as yup from 'yup';
import { getConsumers, getDebtsByConsumer } from '../../api/apollo';

// Type Definitions
type Counter = {
  counterID: string;
  status: string;
};

type Debt = {
  debtID: string;
  amount: string;
  createdAt: string;
  invoiceID: string;
};

type Consumer = {
  consumerID: string;
  fullName: string;
  counters: Counter[];
};

type AddRecordFormValues = {
  consumerID: string;
};

function Debt() {
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
  const initialValues: AddRecordFormValues = {
    consumerID: '',
  };

  const validationSchema = yup.object({
    consumerID: yup.string().required('Consommateur requis'),
  });

  const { error, data: consumersData } = useQuery<{ consumers: Consumer[] }>(
    getConsumers,
  );

  useEffect(() => {
    if (error) {
      console.error('Erreur de requête:', error);
      enqueueSnackbar('Erreur lors du chargement des consommateurs', {
        variant: 'error',
      });
    }
  }, [error]);

  const consumers = consumersData?.consumers ?? [];

  const formik = useFormik<AddRecordFormValues>({
    initialValues,
    validationSchema,
    onSubmit: (values) => {
      console.log('==> values', values);
    },
  });

  const {
    loading: debtsLoading,
    error: debtsError,
    data: debtsData,
    refetch,
  } = useQuery<{ getDebtsByConsumer: Debt[] }>(getDebtsByConsumer, {
    variables: { consumerID: formik.values.consumerID },
    skip: !formik.values.consumerID,
  });

  const filteredDebts =
    debtsData?.getDebtsByConsumer.filter(
      (debt) => parseFloat(debt.amount) > 0,
    ) ?? [];

  const totalDebt =
    filteredDebts.reduce((sum, debt) => sum + parseFloat(debt.amount), 0) || 0;

  return (
    <Box
      sx={{
        maxWidth: 600,
        margin: 'auto',
        padding: 3,
      }}
    >
      <Card elevation={3}>
        <CardContent>
          <Typography
            variant="h4"
            sx={{ textAlign: 'center', marginBottom: 2 }}
          >
            Dette du Consommateur
          </Typography>

          <form onSubmit={formik.handleSubmit}>
            <Autocomplete
              options={consumers}
              getOptionLabel={(option: Consumer) => option.fullName}
              isOptionEqualToValue={(option, value) =>
                option.consumerID === value.consumerID
              }
              value={
                consumers.find(
                  (consumer) =>
                    consumer.consumerID === formik.values.consumerID,
                ) || null
              }
              onChange={(_event, newValue) => {
                formik.setFieldValue(
                  'consumerID',
                  newValue ? newValue.consumerID : '',
                );
                formik.setFieldValue(
                  'counterID',
                  newValue?.counters?.find(
                    (counter) => counter.status === 'En Marche',
                  )?.counterID ?? '',
                );
                if (newValue) refetch({ consumerID: newValue.consumerID });
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Sélectionner un consommateur"
                  error={
                    formik.touched.consumerID &&
                    Boolean(formik.errors.consumerID)
                  }
                  helperText={
                    formik.touched.consumerID && formik.errors.consumerID
                  }
                  fullWidth
                  margin="normal"
                />
              )}
            />
          </form>

          {debtsLoading && (
            <Box
              sx={{ display: 'flex', justifyContent: 'center', marginTop: 2 }}
            >
              <CircularProgress />
            </Box>
          )}

          {debtsError && (
            <Alert severity="error">Erreur de chargement des dettes</Alert>
          )}

          {filteredDebts.length > 0 ? (
            <TableContainer component={Paper} sx={{ marginTop: 2 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <b>Facture</b>
                    </TableCell>
                    <TableCell>
                      <b>Montant</b>
                    </TableCell>
                    <TableCell>
                      <b>Date</b>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredDebts.map((debt) => (
                    <TableRow key={debt?.debtID}>
                      <Tooltip
                        title={
                          copiedId === debt?.invoiceID
                            ? 'Copié'
                            : 'Cliquer pour copier'
                        }
                        arrow
                      >
                        <TableCell
                          onClick={() => handleCopy(debt?.invoiceID)}
                          sx={{
                            fontFamily: 'monospace',
                            cursor: 'pointer',
                            userSelect: 'none',
                            '&:hover': {
                              fontWeight: 'bold',
                            },
                          }}
                        >
                          {debt?.invoiceID}
                        </TableCell>
                      </Tooltip>
                      <TableCell>{debt?.amount} DA</TableCell>
                      <TableCell>
                        {moment(debt?.createdAt).format('DD MMM YYYY')}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell
                      colSpan={2}
                      sx={{ fontWeight: 'bold', textAlign: 'right' }}
                    >
                      Total Dette:
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>
                      {totalDebt.toFixed(2)} DA
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            !debtsLoading && (
              <Typography sx={{ textAlign: 'center', marginTop: 2 }}>
                Aucune dette trouvée.
              </Typography>
            )
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

export default Debt;
