import BASE_URL, { getHeaders } from './api';

export const getDashboardTasks = async (teamId: number) => {
  const response = await fetch(`${BASE_URL}/tasks/dashboard/teams/${teamId}`, {
    headers: getHeaders(),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Error al obtener tareas');
  return data;
};

export const getMemberProfiles = async (teamId: number) => {
  const response = await fetch(`${BASE_URL}/member-profiles/teams/${teamId}`, {
    headers: getHeaders(),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Error al obtener perfiles');
  return data;
};