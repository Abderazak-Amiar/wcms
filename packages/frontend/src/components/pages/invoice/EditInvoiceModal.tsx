import { useMutation, useQuery } from '@apollo/client';
import {
  Autocomplete,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from '@mui/material';
import { useFormik } from 'formik';
import { enqueueSnackbar } from 'notistack';
import * as yup from 'yup';
import { getConsumers, updateRecord } from '../../../api/apollo';
import { getCurrentTrimester } from '../../../helpers/getCurrentTrimester';
import { TrimesterSelector } from '../../molecules/TrimesterSelector';
import { Invoice } from './InvoiceList';

type RecordType = {
  recordID: string;
  consumerID: string;
  counterID: string;
  newRecord: string;
  period: string;
};

type Counter = {
  counterID: string;
  status: string;
};

type Consumer = {
  consumerID: string;
  fullName: string;
  counters: Counter[];
};

export function EditInvoiceModal({
  open,
  onClose,
  invoice,
}: {
  open: boolean;
  onClose: () => void;
  invoice: Invoice | null;
}) {
  console.log('==>invoice', invoice);
  const initialValues: RecordType = {
    recordID: invoice?.record?.recordID || '',
    consumerID: invoice?.consumer?.consumerID || '',
    counterID: invoice?.counter?.counterID || '',
    newRecord: String(invoice?.record?.newRecord || ''),
    period: getCurrentTrimester(),
  };
  const validationSchema = yup.object({
    newRecord: yup
      .string()
      .matches(/^\d+$/, 'Veuillez entrer un nombre valide')
      .required('Recensement requis'),
    consumerID: yup.string().required('Consommateur requis'),
    counterID: yup.string().required('CounterID requis'),
    period: yup.string().required('Periode requise'),
  });

  const [submit, { loading }] = useMutation(updateRecord, {
    onCompleted: () => {
      enqueueSnackbar('Recensement fait avec succès', { variant: 'success' });
      onClose();
    },
    onError: (err) => {
      console.error('==> error', err);
      if (err.message.includes('DUPLICATION')) {
        enqueueSnackbar('Duplication détectée', { variant: 'warning' });
      } else if (err.message.includes('INVALID_RECORD')) {
        enqueueSnackbar('Recensement incorrecte: valeur inférieur', {
          variant: 'error',
        });
      } else {
        enqueueSnackbar('Une erreur est survenue', { variant: 'error' });
      }
    },
  });

  const { loading: queryLoading, data: consumersData } = useQuery<{
    consumers: Consumer[];
  }>(getConsumers);
  const consumers = consumersData?.consumers ?? [];

  const formik = useFormik<RecordType>({
    initialValues: initialValues,
    enableReinitialize: true,
    validationSchema,
    onSubmit: (values) => {
      submit({
        variables: {
          ...values,
          newRecord: String(values.newRecord),
          recordID: invoice?.record?.recordID,
        },
      });
    },
  });

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Modifier la facture</DialogTitle>
      <form onSubmit={formik.handleSubmit}>
        <DialogContent dividers>
          <Stack spacing={2} mt={1}>
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
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Consommateur"
                  error={
                    formik.touched.consumerID &&
                    Boolean(formik.errors.consumerID)
                  }
                  helperText={
                    formik.touched.consumerID && formik.errors.consumerID
                  }
                />
              )}
            />
            <TrimesterSelector
              value={formik.values.period}
              onChange={(value) => formik.setFieldValue('period', value)}
            />
            <TextField
              fullWidth
              type="number"
              id="newRecord"
              name="newRecord"
              label="Consommation d'eau en M³"
              value={formik.values.newRecord}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={
                formik.touched.newRecord && Boolean(formik.errors.newRecord)
              }
              helperText={formik.touched.newRecord && formik.errors.newRecord}
              sx={{ marginBlock: '8px' }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Annuler</Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading || queryLoading}
          >
            {loading || queryLoading ? 'Chargement...' : 'Enregistrer'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
