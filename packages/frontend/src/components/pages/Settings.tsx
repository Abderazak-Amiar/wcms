import { useMutation } from '@apollo/client';
import { Button, TextField, Typography } from '@mui/material';
import { useFormik } from 'formik';
import { enqueueSnackbar } from 'notistack';
import * as yup from 'yup';
import { addSettings } from '../../api/apollo';

// Define Settings Type
type SettingsFormValues = {
  m3Price: string;
  village: string;
};

function AddSettings() {
  const initialValues: SettingsFormValues = {
    m3Price: '',
    village: '',
  };

  const validationSchema = yup.object({
    m3Price: yup
      .string()
      .matches(/^\d+(\.\d{1,2})?$/, 'Veuillez entrer un prix valide') // ✅ Accepts decimal values
      .required('Prix requis'),
    village: yup.string().required('Village requis'),
  });

  // Mutation for adding settings
  const [submit, { loading }] = useMutation(addSettings, {
    onCompleted: () => {
      enqueueSnackbar('Paramètres enregistrés avec succès', {
        variant: 'success',
      });
    },
    onError: (err) => {
      console.error('==> error', err);
      enqueueSnackbar('Une erreur est survenue', { variant: 'error' });
    },
  });

  const formik = useFormik<SettingsFormValues>({
    initialValues,
    validationSchema,
    onSubmit: (values) => {
      submit({
        variables: {
          ...values,
        },
      });
    },
  });

  return (
    <div className="login-form-container">
      <form onSubmit={formik.handleSubmit} className="login-form">
        <Typography variant="h4" sx={{ textAlign: 'start' }}>
          Paramètres
        </Typography>

        <TextField
          fullWidth
          id="m3Price"
          name="m3Price"
          label="Prix par M³"
          value={formik.values.m3Price}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.m3Price && Boolean(formik.errors.m3Price)}
          helperText={formik.touched.m3Price && formik.errors.m3Price}
          sx={{ marginBlock: '8px' }}
        />

        <TextField
          fullWidth
          id="village"
          name="village"
          label="Nom du Village"
          value={formik.values.village}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.village && Boolean(formik.errors.village)}
          helperText={formik.touched.village && formik.errors.village}
          sx={{ marginBlock: '8px' }}
        />

        <Button
          sx={{ marginBlock: '8px' }}
          color="primary"
          variant="contained"
          fullWidth
          type="submit"
          disabled={loading}
        >
          {loading ? 'Chargement...' : 'Enregistrer'}
        </Button>
      </form>
    </div>
  );
}

export default AddSettings;
