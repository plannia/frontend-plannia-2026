import BASE_URL, { getHeaders } from './api';

export interface UserResource {
  id: number;
  name: string;
  email: string;
  position: string;
  role: 'LEADER' | 'MEMBER';
  teamId?: number;
}

export const getUserById = async (userId: number): Promise<UserResource> => {
  const response = await fetch(`${BASE_URL}/users/${userId}`, {
    headers: getHeaders(),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Error al obtener usuario');
  return data;
};

export const updateUser = async (
  userId: number,
  data: { name?: string; email?: string; position?: string; password?: string }
): Promise<UserResource> => {
  const response = await fetch(`${BASE_URL}/users/${userId}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.message || 'Error al actualizar usuario');
  return body;
};

export const deleteUser = async (userId: number): Promise<void> => {
  const response = await fetch(`${BASE_URL}/users/${userId}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  if (response.status === 204) return;
  const body = response.headers.get('content-type')?.includes('json')
    ? await response.json()
    : null;
  if (!response.ok) {
    throw new Error(body?.message || 'Error al eliminar usuario');
  }
};
