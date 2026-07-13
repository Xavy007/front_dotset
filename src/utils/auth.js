
export const handleLogout = (navigate = null) => {
  try {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('usuario');
    localStorage.removeItem('token');
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
  let token = sessionStorage.getItem('token');

  // Si no hay sesión, intentar restaurar desde "Recuérdame"
  if (!token) {
    const persisted = localStorage.getItem('token');
    if (persisted) {
      try {
        const payload = JSON.parse(atob(persisted.split('.')[1]));
        if (payload.exp * 1000 > Date.now()) {
          sessionStorage.setItem('token', persisted);
          token = persisted;
        } else {
          localStorage.removeItem('token');
        }
      } catch {
        localStorage.removeItem('token');
      }
    }
  }

  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
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