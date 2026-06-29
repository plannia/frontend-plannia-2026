import BASE_URL, { getHeaders } from './api';

export const getTeamById = async (teamId: number) => {
  const response = await fetch(`${BASE_URL}/teams/${teamId}`, {
    headers: getHeaders(),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Error al obtener equipo');
  return data;
};