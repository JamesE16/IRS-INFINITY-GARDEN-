export const AUTH_STORAGE_KEYS = [
'adminEmail',
'isAdminLoggedIn',
'adminSession',
'adminRole',
'staffEmail',
'isStaffLoggedIn',
'staffRole',
'access_token'];


export const clearAuthStorage = () => {
  AUTH_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
};

export const getUserRole = (user) => user?.profile?.role || user?.role || null;

export const persistAuthenticatedRole = (user, role) => {
  if (role === 'admin') {
    localStorage.setItem('adminEmail', user?.email || '');
    localStorage.setItem('isAdminLoggedIn', 'true');
    localStorage.setItem('adminRole', 'admin');
    localStorage.removeItem('isStaffLoggedIn');
    localStorage.removeItem('staffRole');
    localStorage.removeItem('staffEmail');
    return;
  }

  if (role === 'staff') {
    localStorage.setItem('staffEmail', user?.email || '');
    localStorage.setItem('isStaffLoggedIn', 'true');
    localStorage.setItem('staffRole', 'staff');
    localStorage.removeItem('isAdminLoggedIn');
    localStorage.removeItem('adminRole');
    localStorage.removeItem('adminEmail');
  }
};
