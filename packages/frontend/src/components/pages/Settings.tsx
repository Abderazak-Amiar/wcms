import { useMutation, useQuery } from '@apollo/client';
import { Button, TextField, Typography } from '@mui/material';
import { useFormik } from 'formik';
import { enqueueSnackbar } from 'notistack';
import * as yup from 'yup';
import { addSettings, getSettings } from '../../api/apollo';

// Define Settings Type
type SettingsFormValues = {
  m3price: GLfloat;
  village: string;
  phone: string;
  email: string;
  deadline: string;
};

function AddSettings() {
  // Fetch existing settings
  const { data, loading: loadingSettings } = useQuery(getSettings);
  // Set initial values based on fetched data or fallback to defaults
  const initialValues: SettingsFormValues = {
    m3price: data?.getSettings?.m3price || '',
    village: data?.getSettings?.village || '',
    phone: data?.getSettings?.phone || '',
    email: data?.getSettings?.email || '',
    deadline: data?.getSettings?.deadline || '',
  };

  const validationSchema = yup.object({
    m3price: yup
      .string()
      .matches(/^\d+(\.\d{1,2})?$/, 'Veuillez entrer un prix valide') // ✅ Accepts decimal values
      .required('Prix requis'),
    village: yup.string().required('Village requis'),
    deadline: yup.string().required('Délais requis'),
  });

  // Mutation for adding/updating settings
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
    enableReinitialize: true, // ✅ Ensures form updates when `data` changes
    validationSchema,
    onSubmit: (values) => {
      console.log('==>values', values);
      submit({
        variables: {
          ...values,
        },
      });
    },
  });

  if (loadingSettings) return <p>Chargement des paramètres...</p>;

  return (
    <div className="login-form-container">
      <form onSubmit={formik.handleSubmit} className="login-form">
        <Typography variant="h4" sx={{ textAlign: 'start' }}>
          Paramètres
        </Typography>
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
          sx={{
            marginBlock: '8px',

            '& .MuiInputBase-input': {
              color: 'rgba(0, 0, 0, 0.4)', // Change text color inside the input
              fontWeight: 'bold',
            },
          }}
        />
        <TextField
          fullWidth
          id="m3price"
          name="m3price"
          label="Prix par M³"
          type='number'
          value={formik.values.m3price}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.m3price && Boolean(formik.errors.m3price)}
          helperText={formik.touched.m3price && formik.errors.m3price}
          sx={{
            marginBlock: '8px',

            '& .MuiInputBase-input': {
              color: 'rgba(0, 0, 0, 0.4)', // Change text color inside the input
              fontWeight: 'bold',
            },
          }}
        />{' '}
        <TextField
          fullWidth
          id="phone"
          name="phone"
          label="Téléphone"
          value={formik.values.phone}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.phone && Boolean(formik.errors.phone)}
          helperText={formik.touched.phone && formik.errors.phone}
          sx={{
            marginBlock: '8px',

            '& .MuiInputBase-input': {
              color: 'rgba(0, 0, 0, 0.4)', // Change text color inside the input
              fontWeight: 'bold',
            },
          }}
        />
        <TextField
          fullWidth
          id="email"
          name="email"
          label="Email"
          value={formik.values.email}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.email && Boolean(formik.errors.email)}
          helperText={formik.touched.email && formik.errors.email}
          sx={{
            marginBlock: '8px',

            '& .MuiInputBase-input': {
              color: 'rgba(0, 0, 0, 0.4)', // Change text color inside the input
              fontWeight: 'bold',
            },
          }}
        />
        <TextField
          fullWidth
          id="deadline"
          name="deadline"
          label="Délais Paiment (Jours)"
          value={formik.values.deadline}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.deadline && Boolean(formik.errors.deadline)}
          helperText={formik.touched.deadline && formik.errors.deadline}
          sx={{
            marginBlock: '8px',

            '& .MuiInputBase-input': {
              color: 'rgba(0, 0, 0, 0.4)', // Change text color inside the input
              fontWeight: 'bold',
            },
          }}
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
