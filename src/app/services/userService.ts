import BASE_URL, { getHeaders } from './api';

export const getUserById = async (userId: number) => {
  const response = await fetch(`${BASE_URL}/users/${userId}`, {
    headers: getHeaders(),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Error al obtener usuario');
  return data;
};

export const updateUser = async (
  userId: number,
  payload: { name: string; email: string; position: string; password?: string }
) => {
  const response = await fetch(`${BASE_URL}/users/${userId}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Error al actualizar usuario');
  return data;
};

export const deleteUser = async (userId: number) => {
  const response = await fetch(`${BASE_URL}/users/${userId}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  if (!response.ok && response.status !== 204) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || 'Error al eliminar usuario');
  }
};
