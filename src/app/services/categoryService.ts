import BASE_URL, { getHeaders } from './api';

export const getCategoriesByTeam = async (teamId: number) => {
  const response = await fetch(`${BASE_URL}/categories/teams/${teamId}`, {
    headers: getHeaders(),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Error al obtener categorías');
  return data;
};

export const createCategory = async (teamId: number, name: string, limitDate: string) => {
  const response = await fetch(`${BASE_URL}/categories`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ teamId, name, limitDate }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Error al crear categoría');
  return data;
};

export const updateCategory = async (categoryId: number, name: string, status: string, limitDate: string) => {
  const response = await fetch(`${BASE_URL}/categories/${categoryId}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ name, status, limitDate }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Error al actualizar categoría');
  return data;
};

export const addMemberToCategory = async (categoryId: number, userId: number) => {
  const response = await fetch(`${BASE_URL}/categories/${categoryId}/members`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ userId }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Error al agregar miembro');
  return data;
};

export const removeMemberFromCategory = async (categoryId: number, userId: number) => {
  const response = await fetch(`${BASE_URL}/categories/${categoryId}/members/${userId}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Error al quitar miembro');
  return data;
};