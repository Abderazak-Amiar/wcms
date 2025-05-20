import { useMutation, useQuery } from '@apollo/client';
import { Autocomplete, Button, TextField, Typography } from '@mui/material';
import { useFormik } from 'formik';
import { enqueueSnackbar } from 'notistack';
import { useCallback, useEffect, useState } from 'react';
import * as yup from 'yup';
import {
  addRecord,
  getConsumers,
  getRecordByConsumerID,
} from '../../../api/apollo';
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
  oldRecord: string;
  period: string;
};

function AddRecord() {
  const [hasCounter, setHasCounter] = useState(false);
  const [isConsumerSelected, setIsConsumerSelected] = useState(false);
  const [selectedConsumerID, setSelectedConsumerID] = useState<string | null>(
    null,
  );

  const initialValues: AddRecordFormValues = {
    consumerID: '',
    counterID: '',
    newRecord: '',
    oldRecord: '',
    period: getCurrentTrimester(),
  };

  const validationSchema = yup.object({
    newRecord: yup
      .string()
      .matches(/^\d+$/, 'Veuillez entrer un nombre valide') // ✅ Accepts only numbers
      .required('Recensement requis'),
    oldRecord: yup
      .string()
      .matches(/^\d+$/, 'Veuillez entrer un nombre valide') // ✅ Accepts only numbers
      .required('Ancien recensement requis'), // Added validation for oldRecord
    consumerID: yup.string().required('Consommateur requis'),
    counterID: yup.string().required('CounterID requis'),
    period: yup.string().required('Periode requise'),
  });

  // Mutation pour ajouter un enregistrement
  const [submit, { loading }] = useMutation(addRecord, {
    onCompleted: () => {
      enqueueSnackbar('Recensement fait avec succès', { variant: 'success' });
      formik.resetForm(); // Reset the form after successful submission
      setSelectedConsumerID(null); // Reset selected consumer
      refetchConsumerRecords(); // Refresh the consumer records
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
    refetchQueries: [{ query: getConsumers }], // Refresh consumer data
  });

  const { refetch: refetchConsumerRecords } = useQuery(getRecordByConsumerID, {
    skip: !selectedConsumerID, // Skip the query if no consumerID is selected
    variables: { consumerID: selectedConsumerID },
  });

  // Requête pour récupérer la liste des consommateurs
  const {
    loading: queryLoading,
    error: queryError,
    data: consumersData,
  } = useQuery<{ consumers: Consumer[] }>(getConsumers);

  // Requête pour récupérer le dernier enregistrement du consommateur sélectionné
  const {
    data: consumerRecords,
    loading: loadingRecords,
    error: recordErrors,
  } = useQuery(getRecordByConsumerID, {
    skip: !selectedConsumerID, // Skip the query if no consumerID is selected
    variables: { consumerID: selectedConsumerID },
  });

  useEffect(() => {
    if (queryError) {
      console.error('Erreur de requête:', queryError);
      enqueueSnackbar('Erreur lors du chargement des consommateurs', {
        variant: 'error',
      });
    }
  }, [queryError]);

  const consumers = consumersData?.consumers ?? [];

  const formik = useFormik<AddRecordFormValues>({
    initialValues,
    validationSchema,
    onSubmit: (values) => {
      console.log('==>values', values);
      submitRecord(values);
    },
  });

  // Pré-remplir oldRecord si un enregistrement existe
  useEffect(() => {
    if (consumerRecords?.getRecordByConsumerID) {
      const { newRecord } = consumerRecords.getRecordByConsumerID;
      if (formik.values.oldRecord !== newRecord) {
        formik.setFieldValue('oldRecord', newRecord); // Prefill oldRecord with the last newRecord
      }
    } else if (formik.values.oldRecord !== '') {
      formik.setFieldValue('oldRecord', ''); // Reset oldRecord if no record exists
    }
  }, [consumerRecords]);

  const submitRecord = useCallback(
    (values: AddRecordFormValues) => {
      submit({
        variables: {
          ...values,
          newRecord: String(values.newRecord), // ✅ Convert to string
          oldRecord: String(values.oldRecord), // ✅ Convert to string
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
            setIsConsumerSelected(true);
            console.log('==>newValue', newValue);
            newValue?.counters.length === 0
              ? setHasCounter(false)
              : setHasCounter(true);

            const consumerID = newValue ? newValue.consumerID : '';
            setSelectedConsumerID(consumerID); // Set the selected consumerID

            formik.setFieldValue('consumerID', consumerID);
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
        {!consumerRecords?.getRecordByConsumerID && (
          <TextField
            fullWidth
            type="number"
            id="oldRecord"
            name="oldRecord"
            label="Ancien recensement en M³"
            value={formik.values.oldRecord}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.oldRecord && Boolean(formik.errors.oldRecord)}
            helperText={formik.touched.oldRecord && formik.errors.oldRecord}
            sx={{ marginBlock: '8px' }}
          />
        )}
        <TextField
          fullWidth
          type="number"
          id="newRecord"
          name="newRecord"
          label="Nouveau recensement en M³"
          value={formik.values.newRecord}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.newRecord && Boolean(formik.errors.newRecord)}
          helperText={formik.touched.newRecord && formik.errors.newRecord}
          sx={{ marginBlock: '8px' }}
        />
        {isConsumerSelected && !hasCounter && (
          <Typography color="error" variant="body2" sx={{ mt: 1 }}>
            Aucun compteur associé à ce consommateur
          </Typography>
        )}
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
