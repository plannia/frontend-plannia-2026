import BASE_URL, { getHeaders } from './api';

export const getUserById = async (userId: number) => {
  const response = await fetch(`${BASE_URL}/users/${userId}`, {
    headers: getHeaders(),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Error al obtener usuario');
  return data;
};