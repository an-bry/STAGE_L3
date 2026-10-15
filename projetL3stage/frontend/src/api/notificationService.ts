import api from './axiosConfig';

export interface Notification {
  id: number;
  message: string;
  lien: string;
  lu: boolean;
  date: string;
}

export const getNotifications = async (): Promise<Notification[]> => {
  const response = await api.get('/smart-ticket/notifications/');
  return response.data;
};

export const marquerNotificationLue = async (id: number): Promise<Notification> => {
  const response = await api.patch(`/smart-ticket/notifications/${id}/lue/`);
  return response.data;
};

export const marquerToutesNotificationsLues = async (): Promise<{ detail: string }> => {
  const response = await api.patch('/smart-ticket/notifications/tout-lire/');
  return response.data;
};