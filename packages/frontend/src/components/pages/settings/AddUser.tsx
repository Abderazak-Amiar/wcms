import { useMutation } from '@apollo/client';
import { Autocomplete, Button, TextField, Typography } from '@mui/material';
import { useFormik } from 'formik';
import { enqueueSnackbar } from 'notistack';
import * as yup from 'yup';
import { addUser } from '../../../api/apollo';

function AddUser() {
  const initialValues = {
    userName: '',
    password: '',
    role: '',
  };

  const validationSchema = yup.object({
    userName: yup.string().required('Nom d’utilisateur requis'),
    password: yup
      .string()
      .min(6, 'Le mot de passe doit contenir au moins 6 caractères')
      .required('Mot de passe requis'),
    role: yup.string().required('Rôle requis'),
  });

  const [submit, { loading }] = useMutation(addUser, {
    onCompleted: () => {
      enqueueSnackbar('Utilisateur crée avec succès', {
        variant: 'success',
      });
    },
    onError: (error) => {
      if (
        error.message.includes(
          'SQLITE_CONSTRAINT: UNIQUE constraint failed: user.userName',
        )
      ) {
        enqueueSnackbar(`Utilisateur existe Déja`, {
          variant: 'error',
          style: { fontSize: '14px' },
        });
      } else {
        enqueueSnackbar('Une erreur est survenue', { variant: 'error' });
      }
    },
  });

  const formik = useFormik({
    initialValues,
    enableReinitialize: true,
    validationSchema,
    onSubmit: (values) => {
      submit({
        variables: {
          userName: values.userName,
          password: values.password,
          role: values.role,
        },
      });
    },
  });

  return (
    <div className="login-form-container">
      <form onSubmit={formik.handleSubmit} className="login-form">
        <Typography variant="h4" sx={{ textAlign: 'start' }}>
          Ajouter un utilisateur
        </Typography>
        <TextField
          fullWidth
          id="userName"
          name="userName"
          label="Nom d’utilisateur"
          value={formik.values.userName}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.userName && Boolean(formik.errors.userName)}
          helperText={
            formik.touched.userName &&
            typeof formik.errors.userName === 'string'
              ? formik.errors.userName
              : undefined
          }
          sx={{
            marginBlock: '8px',
            '& .MuiInputBase-input': {
              color: 'rgba(0, 0, 0, 0.4)',
              fontWeight: 'bold',
            },
          }}
        />
        <TextField
          fullWidth
          id="password"
          name="password"
          label="Mot de passe"
          type="password"
          value={formik.values.password}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.password && Boolean(formik.errors.password)}
          helperText={
            formik.touched.password &&
            typeof formik.errors.password === 'string'
              ? formik.errors.password
              : undefined
          }
          sx={{
            marginBlock: '8px',
            '& .MuiInputBase-input': {
              color: 'rgba(0, 0, 0, 0.4)',
              fontWeight: 'bold',
            },
          }}
        />
        <Autocomplete
          options={['administrateur', 'utilisateur']}
          value={formik.values.role}
          onChange={(_event, newValue) =>
            formik.setFieldValue('role', newValue)
          }
          renderInput={(params) => (
            <TextField
              {...params}
              label="Rôle"
              error={formik.touched.role && Boolean(formik.errors.role)}
              helperText={
                formik.touched.role && typeof formik.errors.role === 'string'
                  ? formik.errors.role
                  : undefined
              }
            />
          )}
          sx={{
            marginBlock: '8px',
            '& .MuiInputBase-input': {
              color: 'rgba(0, 0, 0, 0.4)',
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

export default AddUser;
