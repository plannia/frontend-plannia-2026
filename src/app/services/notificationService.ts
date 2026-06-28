import BASE_URL, { getHeaders } from './api';

export interface NotificationResource {
  id: number;
  userId: number;
  taskId: number;
  email: string;
  message: string;
  channel: string;
}

export const getNotifications = async () => {
  const response = await fetch(`${BASE_URL}/notifications`, {
    headers: getHeaders(),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Error al obtener notificaciones');
  return data as NotificationResource[];
};

export const getNotificationsByUser = async (userId: number) => {
  const response = await fetch(`${BASE_URL}/notifications/users/${userId}`, {
    headers: getHeaders(),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Error al obtener notificaciones');
  return data as NotificationResource[];
};
