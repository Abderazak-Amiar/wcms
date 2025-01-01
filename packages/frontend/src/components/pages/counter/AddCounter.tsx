import { useMutation, useQuery } from '@apollo/client';
import { Autocomplete, Button, TextField, Typography } from '@mui/material';
import { FormikHelpers, useFormik } from 'formik';
import { useState } from 'react';
import * as yup from 'yup';
import { addCounter, getConsumers } from '../../../api/apollo';

// Define the types for the consumer and form values
type Consumer = {
  consumerID: string;
  fullName: string;
};

interface AddCounterFormValues {
  counterNumber: string;
  price: string;
  consumerID: string;
}

function AddCounter() {
  const initialValues: AddCounterFormValues = {
    counterNumber: '',
    price: '',
    consumerID: '',
  };

  const validationSchema = yup.object({
    counterNumber: yup.string().required('Numéro compteur requis'),
    price: yup.string().required('Prix requis'),
    consumerID: yup.string().required('Consomateur requis'),
  });

  // Formik setup with types
  const formik = useFormik<AddCounterFormValues>({
    initialValues,
    validationSchema,
    onSubmit: (
      values: AddCounterFormValues,
      formikHelpers: FormikHelpers<AddCounterFormValues>,
    ) => {
      console.log('==>values', values);
      // Call the mutation on submit
      submit({ variables: values });
    },
  });

  const [submit, { loading, error, data }] = useMutation(addCounter, {
    onCompleted: (res) => {
      console.log('==>onCompleted', res);
    },
  });

  const {
    loading: queryLoading,
    error: queryError,
    data: consumersData,
  } = useQuery<{ consumers: Consumer[] }>(getConsumers);

  if (queryLoading) console.log('==>loading', queryLoading);
  if (queryError) console.log('==>error', queryError);

  // Fallback data for consumers in case of an empty response
  const consumers = consumersData?.consumers ?? [];

  // Handling the selected consumer's ID
  const [selectedConsumerID, setSelectedConsumerID] = useState<string | null>(
    null,
  );

  return (
    <div className="login-form-container">
      <form onSubmit={formik.handleSubmit} className="login-form">
        <Typography variant="h4" sx={{ textAlign: 'start' }}>
          Nouveau compteur
        </Typography>

        {/* Counter Number Field */}
        <TextField
          fullWidth
          id="counterNumber"
          name="counterNumber"
          label="Numéro de compteur"
          value={formik.values.counterNumber}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={
            formik.touched.counterNumber && Boolean(formik.errors.counterNumber)
          }
          helperText={
            formik.touched.counterNumber && formik.errors.counterNumber
          }
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
