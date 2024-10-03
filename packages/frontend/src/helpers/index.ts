import { redirect } from 'react-router-dom';

const isAuthenticated = async () => {
  const token = localStorage.getItem('token');
  if (token) throw redirect('/home');
  return null;
};

export default isAuthenticated;
