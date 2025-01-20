import { useMutation, useQuery } from '@apollo/client';
import { Button, TextField, Typography } from '@mui/material';
import { useFormik } from 'formik';
import { enqueueSnackbar } from 'notistack';
import { useEffect, useState } from 'react';
import * as yup from 'yup';
import { addConsumer, getConsumers } from '../../../api/apollo';
import { addConsumerType } from './AddConsumer.type';

function AddConsumer() {
  const initialValues: addConsumerType = {
    fullName: '',
  };

  const [consumer, setConsumer] = useState<addConsumerType>(initialValues);

  const validationSchema = yup.object({
    fullName: yup.string().required('Consomateur requis'),
  });

  const formik = useFormik({
    initialValues: initialValues,
    validationSchema: validationSchema,
    onSubmit: (values: addConsumerType) => {
      console.log('==>values', values);
    },
  });

  useEffect(() => {
    setConsumer(formik.values);
  }, [formik.values]);

  const { refetch } = useQuery(getConsumers);

  const [submit, { loading, error, data }] = useMutation(addConsumer, {
    onCompleted: (res) => {
      console.log('==>onCompleted', res.addConsumer.consumerID);
      res.addConsumer.consumerID &&
        enqueueSnackbar('Consomateur ajouté', { variant: 'success' });

      // Refetch the consumer list after adding a new one
      refetch();
    },
  });

  if (loading) {
    console.log('==>loading', loading);
  }
  if (error) {
    console.log('==>error', error);
  }
  console.log('==>data', data);

  return (
    <div className="login-form-container">
      <form onSubmit={formik.handleSubmit} className="login-form">
        <Typography variant="h4" sx={{ textAlign: 'start' }}>
          Ajouter un consomateur
        </Typography>
        <TextField
          fullWidth
          id="fullName"
          name="fullName"
          label="Nom complet"
          value={formik.values.fullName}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.fullName && Boolean(formik.errors.fullName)}
          helperText={formik.touched.fullName && formik.errors.fullName}
          sx={{ marginBlock: '8px' }}
        />
        <Button
          sx={{ marginBlock: '8px' }}
          color="primary"
          variant="contained"
          fullWidth
          type="submit"
          disabled={formik.values.fullName === '' && true}
          onClick={() => submit({ variables: consumer })}
        >
          Ajouter
        </Button>
      </form>
    </div>
  );
}

export default AddConsumer;
