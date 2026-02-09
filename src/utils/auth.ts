export const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken');
};

export const isAuthenticated = (): boolean => {
  const token = localStorage.getItem('authToken');
  return !!token;
};

export const clearAuth = (): void => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
};