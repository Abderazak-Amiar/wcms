import { useLazyQuery } from '@apollo/client';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import { Button, Link, TextField, Typography } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { useTheme } from '@mui/material/styles';
import { useFormik } from 'formik';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as yup from 'yup';
import { getUser } from '../../api/apollo';
import { useAuthStore } from '../../store/useAuthStore';
import { userLoginType } from './LoginForm.type';

function LoginForm() {
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const navigate = useNavigate();
  const theme = useTheme();
  const initialValues: userLoginType = {
    userName: '',
    password: '',
  };

  const [user, setUser] = useState<userLoginType>(initialValues);

  const validationSchema = yup.object({
    userName: yup.string().required('Utilisateur requis'),
    password: yup
      .string()
      .min(6, 'Le mot de passe doit contenir au minimum 6 caractères')
      .required('Mot de passe requis'),
  });

  const formik = useFormik({
    initialValues: initialValues,
    validationSchema: validationSchema,
    onSubmit: (values: userLoginType) => {
      console.log('==>values', values);
    },
  });

  useEffect(() => {
    setUser(formik.values);
  }, [formik.values]);

  const setRole = useAuthStore((state) => state.setRole);

  const [submit] = useLazyQuery(getUser, {
    onCompleted: (data) => {
      if (data?.userLogin.success) {
        const { role } = JSON.parse(data.userLogin.data);
        localStorage.setItem('token', data.userLogin.data);
        setRole(role);
        navigate('/welcome');
        setIsLoggedIn(true);
      } else {
        setIsLoggedIn(false);
      }
    },
    onError: (err) => {
      console.log('==>err', err);
    },
  });
console.log('==>isLoggedIn',isLoggedIn);
  return (
    <div className="login-form-container">
      <form onSubmit={formik.handleSubmit} className="login-form">
        <WaterDropIcon
          sx={{ fontSize: '64px', color: theme.palette.primary.light }}
        />
        <Typography variant="h1">WCMS</Typography>
        <Typography
          variant="h5"
          color={theme.palette.grey[400]}
          sx={{ marginBottom: '64px' }}
        >
          Gestion de consomation d’eau - village TAOURIRT
        </Typography>
        <TextField
          fullWidth
          id="userName"
          name="userName"
          type="text"
          label="Utilisateur"
          value={formik.values.userName}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.userName && Boolean(formik.errors.userName)}
          helperText={formik.touched.userName && formik.errors.userName}
          sx={{ marginBlock: '8px' }}
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
          helperText={formik.touched.password && formik.errors.password}
          sx={{ marginBlock: '8px' }}
        />
        {!isLoggedIn && (
          <Typography color="error" variant="body2" sx={{ mt: 1 }}>
            Nom d'utilisateur ou mot de passe incorrect
          </Typography>
        )}
        <Button
          sx={{ marginBlock: '8px' }}
          color="primary"
          variant="contained"
          fullWidth
          type="submit"
          onClick={() => submit({ variables: user })}
        >
          Connexion
        </Button>
        <Grid container sx={{ justifyContent: 'space-between' }}>
          <Grid>
            <Typography sx={{ color: theme.palette.grey[500] }}>
              Developpé par Abderazak Amiar
            </Typography>
          </Grid>
          <Grid>
            <Typography>
              <Link
                sx={{ textDecoration: 'none', color: theme.palette.grey[500] }}
                href="https://www.linkedin.com/in/zakamiar/"
              >
                <LinkedInIcon />
              </Link>
            </Typography>
          </Grid>
        </Grid>
      </form>
    </div>
  );
}

export default LoginForm;
