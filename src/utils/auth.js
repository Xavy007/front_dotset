
export const handleLogout = (navigate = null) => {
  try {
    // Limpiar tokens y datos del usuario
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
     localStorage.removeItem('user');  
    localStorage.removeItem('refreshToken');
    
    sessionStorage.clear();
    console.log('Sesión cerrada exitosamente');
   
    console.log('Token eliminado:', localStorage.getItem('token')); // Debe ser null
    console.log('Usuario eliminado:', localStorage.getItem('usuario')); // Debe ser null
    console.log('Sesión cerrada exitosamente');
    localStorage.clear();
    if (navigate) {
      // Si se pasó navigate, usarlo
      navigate('/');
    } else {
      // Si no, usar window.location
      window.location.href = '/';
    }
    
  } catch (error) {
    console.error('Error al cerrar sesión:', error);
    alert('Hubo un error al cerrar sesión. Por favor intenta de nuevo.');
  }
};


export const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  return !!token;
};


export const getCurrentUser = () => {
  const user = localStorage.getItem('usuario');
  return user ? JSON.parse(user) : null;
};


export const saveToken = (token) => {
  localStorage.setItem('token', token);
};


export const saveUser = (user) => {
  localStorage.setItem('usuario', JSON.stringify(user));
};