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

// Shape que consume la UI (campanita + página de Notificaciones).
export interface UiNotification {
  id: number;
  type: string;
  icon: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
}

// Trae las notificaciones REALES del usuario y las mapea al shape de la UI.
// El backend solo guarda message/channel; title/icon/type se derivan. 'read' parte en false
// porque no hay endpoint de "marcar leído" (el estado leído es local a la sesión).
export async function getUiNotificationsByUser(userId: number): Promise<UiNotification[]> {
  const items = await getNotificationsByUser(userId);
  return items.map((n) => ({
    id: n.id,
    type: 'assignment',
    icon: '📋',
    title: 'Nueva tarea asignada',
    message: n.message,
    time: '',
    read: false,
  }));
}
