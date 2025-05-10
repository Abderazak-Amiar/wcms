import { useMutation, useQuery } from '@apollo/client';
import { Autocomplete, Button, TextField, Typography } from '@mui/material';
import { useFormik } from 'formik';
import { enqueueSnackbar } from 'notistack';
import { useCallback, useEffect } from 'react';
import * as yup from 'yup';
import { addRecord, getConsumers } from '../../../api/apollo';
import { getCurrentTrimester } from '../../../helpers/getCurrentTrimester';
import { TrimesterSelector } from '../../molecules/TrimesterSelector';

// Définition des types
type Counter = {
  counterID: string;
  status: string;
};

type Consumer = {
  consumerID: string;
  fullName: string;
  counters: Counter[];
};

type AddRecordFormValues = {
  consumerID: string;
  counterID: string;
  newRecord: string;
  period: string;
};

function AddRecord() {
  const initialValues: AddRecordFormValues = {
    consumerID: '',
    counterID: '',
    newRecord: '',
    period: getCurrentTrimester(),
  };

  const validationSchema = yup.object({
    newRecord: yup
      .string()
      .matches(/^\d+$/, 'Veuillez entrer un nombre valide') // ✅ Accepte uniquement les chiffres
      .required('Recensement requis'),
    consumerID: yup.string().required('Consommateur requis'),
    counterID: yup.string().required('CounterID requis'),
    period: yup.string().required('Periode requise'),
  });

  // Mutation pour ajouter un enregistrement
  const [submit, { loading }] = useMutation(addRecord, {
    onCompleted: () => {
      enqueueSnackbar('Recensement fait avec succès', { variant: 'success' });
    },
    onError: (err) => {
      console.error('==> error', err);
      if (err.message.includes('DUPLICATION')) {
        enqueueSnackbar('Duplication détectée', { variant: 'warning' });
      } else if (err.message.includes('INVALID_RECORD')) {
        enqueueSnackbar('Recensement incorrecte: valeur inférieur', {
          variant: 'error',
        });
      } else if (
        err.message.includes(
          'INVOICE_EXISTS: An invoice already exists for this consumer and period',
        )
      ) {
        enqueueSnackbar('Facture Existe Pour Cette Période', {
          variant: 'error',
        });
      } else {
        enqueueSnackbar('Une erreur est survenue', { variant: 'error' });
      }
    },
  });

  // Requête pour récupérer la liste des consommateurs
  const {
    loading: queryLoading,
    error: queryError,
    data: consumersData,
  } = useQuery<{ consumers: Consumer[] }>(getConsumers);

  // Affichage d'une notification en cas d'erreur de requête
  useEffect(() => {
    if (queryError) {
      console.error('Erreur de requête:', queryError);
      enqueueSnackbar('Erreur lors du chargement des consommateurs', {
        variant: 'error',
      });
    }
  }, [queryError]);

  const consumers = consumersData?.consumers ?? [];

  // Formik pour gérer le formulaire
  const formik = useFormik<AddRecordFormValues>({
    initialValues,
    validationSchema,
    onSubmit: (values) => {
      console.log('==>values', values);
      submitRecord(values);
    },
  });

  const submitRecord = useCallback(
    (values: AddRecordFormValues) => {
      submit({
        variables: {
          ...values,
          newRecord: String(values.newRecord), // ✅ Conversion en string
        },
      });
    },
    [submit],
  );

  return (
    <div className="login-form-container">
      <form onSubmit={formik.handleSubmit} className="login-form">
        <Typography variant="h4" sx={{ textAlign: 'start' }}>
          Recensement
        </Typography>

        <Autocomplete
          options={consumers}
          getOptionLabel={(option: Consumer) => option.fullName}
          isOptionEqualToValue={(option, value) =>
            option.consumerID === value.consumerID
          }
          value={
            consumers.find(
              (consumer) => consumer.consumerID === formik.values.consumerID,
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
                formik.touched.consumerID && Boolean(formik.errors.consumerID)
              }
              helperText={formik.touched.consumerID && formik.errors.consumerID}
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
          error={formik.touched.newRecord && Boolean(formik.errors.newRecord)}
          helperText={formik.touched.newRecord && formik.errors.newRecord}
          sx={{ marginBlock: '8px' }}
        />

        <Button
          sx={{ marginBlock: '8px' }}
          color="primary"
          variant="contained"
          fullWidth
          type="submit"
          disabled={loading || queryLoading}
        >
          {loading || queryLoading ? 'Chargement...' : 'Ajouter'}
        </Button>
      </form>
    </div>
  );
}

export default AddRecord;
