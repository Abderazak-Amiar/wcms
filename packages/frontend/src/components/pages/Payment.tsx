import { useMutation, useQuery } from '@apollo/client';
import { Autocomplete, Button, TextField, Typography } from '@mui/material';
import { useFormik } from 'formik';
import { enqueueSnackbar } from 'notistack';
import { useCallback, useEffect } from 'react';
import * as yup from 'yup';
import { addPayment, getConsumers } from '../../api/apollo';

// Définition des types

type Consumer = {
  consumerID: string;
  fullName: string;
};

type PymentFormValues = {
  consumerID: string;
  invoiceID: string;
  paidAmount: string;
};

function AddRecord() {
  const initialValues: PymentFormValues = {
    consumerID: '',
    invoiceID: '',
    paidAmount: '',
  };

  const validationSchema = yup.object({
    paidAmount: yup
      .string()
      .matches(/^\d+$/, 'Veuillez entrer un nombre valide') // ✅ Accepte uniquement les chiffres
      .required('Montant requis'),
    consumerID: yup.string().required('Consommateur requis'),
    invoiceID: yup.string().required('N° de facture requis'),
  });

  // Mutation pour ajouter un enregistrement
  const [submit, { loading }] = useMutation(addPayment, {
    onCompleted: () => {
      enqueueSnackbar('Paiement fait avec succès', { variant: 'success' });
    },
    onError: (err) => {
      console.error('==> error', err);
      if (err.message.includes('Total paid amount exceeds invoice amount')) {
        enqueueSnackbar('Montant supérieur !', { variant: 'info' });
      } else if (err.message.includes('Invoice is already fully paid')) {
        enqueueSnackbar('Facture déja payée !', { variant: 'info' });
      } else if (err.message.includes('Invoice not found')) {
        enqueueSnackbar('Facture Non Trouvée', {
          variant: 'error',
        });
      } else if (
        err.message.includes('Invoice does not belong to this consumer')
      ) {
        enqueueSnackbar("Facture n'appartient pas à ce consommateur", {
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
    refetch,
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

  const stableRefetch = useCallback(() => {
    refetch();
  }, [refetch]);

  useEffect(() => {
    stableRefetch();
  }, [stableRefetch]); // ✅ No ESLint warning
  const consumers = consumersData?.consumers ?? [];

  // Formik pour gérer le formulaire
  const formik = useFormik<PymentFormValues>({
    initialValues,
    validationSchema,
    onSubmit: (values) => {
      console.log('==>values', values);
      submitPayment(values);
    },
  });

  const submitPayment = useCallback(
    async (values: PymentFormValues) => {
      try {
        await submit({
          variables: {
            ...values,
          },
        });
        formik.resetForm(); // reset after successful submit
      } catch (error) {
        console.error('Payment submission error:', error);
      }
    },
    [submit, formik],
  );

  return (
    <div className="login-form-container">
      <form onSubmit={formik.handleSubmit} className="login-form">
        <Typography variant="h4" sx={{ textAlign: 'start' }}>
          Paiement Facture
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

        <TextField
          fullWidth
          type="text"
          id="invoiceID"
          name="invoiceID"
          label="N° Facture"
          value={formik.values.invoiceID}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.paidAmount && Boolean(formik.errors.invoiceID)}
          helperText={formik.touched.invoiceID && formik.errors.invoiceID}
          sx={{ marginBlock: '8px' }}
        />
        <TextField
          fullWidth
          type="number"
          id="paidAmount"
          name="paidAmount"
          label="Montant"
          value={formik.values.paidAmount}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.paidAmount && Boolean(formik.errors.paidAmount)}
          helperText={formik.touched.paidAmount && formik.errors.paidAmount}
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
