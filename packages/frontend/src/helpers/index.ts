import { redirect } from 'react-router-dom';

const isAuthenticated = async () => {
  const token = localStorage.getItem('token');
  if (token) throw redirect('/welcome');
  return null;
};

export default isAuthenticated;
