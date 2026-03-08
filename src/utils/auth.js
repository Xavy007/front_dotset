
export const handleLogout = (navigate = null) => {
  try {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('usuario');
    localStorage.removeItem('loginBlocked');
    localStorage.removeItem('blockedUntil');
    localStorage.removeItem('loginAttempts');

    if (navigate) {
      navigate('/');
    } else {
      window.location.href = '/';
    }
  } catch (error) {
    window.location.href = '/';
  }
};


export const isAuthenticated = () => {
  const token = sessionStorage.getItem('token');
  return !!token;
};


export const getCurrentUser = () => {
  const user = sessionStorage.getItem('usuario');
  return user ? JSON.parse(user) : null;
};


export const saveToken = (token) => {
  sessionStorage.setItem('token', token);
};


export const saveUser = (user) => {
  sessionStorage.setItem('usuario', JSON.stringify(user));
};