import { Button, TextField, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useFormik } from 'formik';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as yup from 'yup';
// import { getUser } from '../../api/apollo';
import { useMutation } from '@apollo/client';
import { addConsumer } from '../../../api/apollo';
import { addConsumerType } from './AddConsumer.type';

function AddConsumer() {
  const navigate = useNavigate();
  const theme = useTheme();
  const initialValues: addConsumerType = {
    fullName: '',
  };

  const [consumer, setConsumer] = useState<addConsumerType>(initialValues);

  const validationSchema = yup.object({
    userName: yup.string().required('Consomateur requis'),
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

  const [submit, { loading, error, data }] = useMutation(addConsumer);
  if (loading) {
    console.log('==>loading', loading);
  }
  if (error) {
    console.log('==>error', error);
  }
  console.log('==>data', data?.user);
  useEffect(() => {
    if (data?.user) {
      localStorage.setItem('token', data.user.userID);
      navigate('/home');
    }
  }, [data, navigate]);
  console.log('==>consumer', consumer);
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
          onClick={() => submit({ variables: consumer })}
        >
          Ajouter
        </Button>
      </form>
    </div>
  );
}

export default AddConsumer;
