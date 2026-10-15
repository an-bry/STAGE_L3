import api from './axiosConfig';

export interface LoginData {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  role: 'CLIENT' | 'ADMIN' | 'TECHNICIEN';
  telephone?: string;
  raison_sociale?: string;
  specialite?: string;
}

export const login = async (data: LoginData) => {
  const response = await api.post('/login/', data);
  return response.data;
};

export const register = async (data: RegisterData) => {
  const response = await api.post('/accounts/register/', data);
  return response.data;
};

export const getProfil = async () => {
  const response = await api.get('/accounts/profil/');
  return response.data;
};

export const forgotPassword = async (email: string) => {
  const response = await api.post('/accounts/forgot-password/', { email });
  return response.data;
};

export const resetPassword = async (uid: string, token: string, new_password: string) => {
  const response = await api.post('/accounts/reset-password/', { uid, token, new_password });
  return response.data;
};
export const getTechniciens = async () => {
  const response = await api.get('/accounts/techniciens/');
  return response.data;
};