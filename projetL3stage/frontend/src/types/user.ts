export interface Utilisateur {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  role: 'CLIENT' | 'ADMIN' | 'TECHNICIEN';
  telephone?: string;
  raison_sociale?: string;
  specialite?: string;
}