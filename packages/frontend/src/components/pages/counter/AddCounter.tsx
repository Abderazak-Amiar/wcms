import { useMutation, useQuery } from '@apollo/client';
import { Autocomplete, Button, TextField, Typography } from '@mui/material';
import { useFormik } from 'formik';
import { enqueueSnackbar } from 'notistack';
import { useEffect, useState } from 'react';
import * as yup from 'yup';
import { addCounter, getConsumers } from '../../../api/apollo';

// Define the types for the consumer and form values
type Consumer = {
  consumerID: string;
  fullName: string;
};

type AddCounterFormValues = {
  counterID: string;
  price: string;
  consumerID: string;
};

function AddCounter() {
  const initialValues: AddCounterFormValues = {
    counterID: '',
    price: '',
    consumerID: '',
  };
  const [counter, setCounter] = useState<AddCounterFormValues>(initialValues);

  const validationSchema = yup.object({
    counterID: yup.string().required('Numéro compteur requis'),
    price: yup.string().required('Prix requis'),
    consumerID: yup.string().required('Consomateur requis'),
  });

  // Formik setup with types
  const formik = useFormik<AddCounterFormValues>({
    initialValues,
    validationSchema,
    onSubmit: (values: AddCounterFormValues) => {
      console.log('==>values', values);
      submit({ variables: values });
    },
  });
  useEffect(() => {
    setCounter(formik.values);
  }, [formik.values]);

  const [submit, { loading, error, data }] = useMutation(addCounter, {
    onCompleted: (res) => {
      console.log('==>onCompleted', res);
      enqueueSnackbar('Compteur ajouté', { variant: 'success' });
      refetch();
      formik.resetForm();
    },
    onError: (err) => {
      console.log('==>error', err.message);
      if (err.message.includes('ACTIVE_COUNTER_EXISTS')) {
        enqueueSnackbar('Possède un compteur en marche', {
          variant: 'warning',
        });
      } else if (err.message.includes('DUPLICATE_COUNTER_ID')) {
        enqueueSnackbar('Compteur existe', { variant: 'warning' });
      } else if (
        err.message.includes(
          'SQLITE_CONSTRAINT: UNIQUE constraint failed: counter.counterID',
        )
      ) {
        enqueueSnackbar('Compteur Attribué', { variant: 'warning' });
      } else {
        enqueueSnackbar('Une erreur est survenue', { variant: 'error' });
      }
    },
  });

  const {
    refetch,
    loading: queryLoading,
    error: queryError,
    data: consumersData,
  } = useQuery<{ consumers: Consumer[] }>(getConsumers);
  refetch();
  if (queryLoading) console.log('==>loading', queryLoading);
  if (queryError) console.log('==>error', queryError);

  // Fallback data for consumers in case of an empty response
  const consumers = consumersData?.consumers ?? [];

  return (
    <div className="login-form-container">
      <form onSubmit={formik.handleSubmit} className="login-form">
        <Typography variant="h4" sx={{ textAlign: 'start' }}>
          Nouveau compteur
        </Typography>

        {/* Counter Number Field */}
        <TextField
          fullWidth
          id="counterID"
          name="counterID"
          label="Numéro de compteur"
          value={formik.values.counterID}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.counterID && Boolean(formik.errors.counterID)}
          helperText={formik.touched.counterID && formik.errors.counterID}
          sx={{ marginBlock: '8px' }}
        />

        {/* Price Field */}
        <TextField
          fullWidth
          id="price"
          name="price"
          label="Prix(DA)"
          value={formik.values.price}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.price && Boolean(formik.errors.price)}
          helperText={formik.touched.price && formik.errors.price}
          sx={{ marginBlock: '8px' }}
        />

        {/* Consumer Autocomplete */}
        <Autocomplete
          options={consumers}
          getOptionLabel={(option: Consumer) => option.fullName}
          isOptionEqualToValue={(option: Consumer, value: Consumer) =>
            option.consumerID === value.consumerID
          }
          value={
            consumers.find(
              (consumer) => consumer.consumerID === formik.values.consumerID,
            ) || null
          }
          onChange={(
            event: React.SyntheticEvent,
            newValue: Consumer | null,
          ) => {
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
              helperText={
                formik.touched.consumerID && formik.errors.consumerID
                  ? formik.errors.consumerID
                  : ''
              }
            />
          )}
        />

        {/* Submit Button */}
        <Button
          sx={{ marginBlock: '8px' }}
          color="primary"
          variant="contained"
          fullWidth
          type="submit"
          disabled={loading}
        >
          Ajouter
        </Button>
      </form>
    </div>
  );
}

export default AddCounter;
