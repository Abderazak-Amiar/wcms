import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import isAuthenticated from '../../helpers';
import LoginForm from '../molecules/LoginForm';

function Login() {
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const auth = await isAuthenticated();
      console.log('==>auth', auth);
      if (auth) {
        navigate('/welcome');
      }
    })();
  }, [navigate]);

  return (
    <div className="login-page">
      <LoginForm />
    </div>
  );
}

export default Login;
