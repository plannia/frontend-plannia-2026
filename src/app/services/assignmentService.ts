import BASE_URL, { getHeaders, readJson } from './api';

export interface AssignmentResource {
  id: number;
  userId: number;
  taskId: number;
  skillMatch?: number;
  experienceMatch?: number;
  interestMatch?: number;
  score?: number;
  status?: string;
}

export interface CandidateProfileResource {
  userId: number;
  activeHours: number;
  maxHours: number;
  availableHours: number;
}

export const getAssignmentsByUser = async (userId: number) => {
  const response = await fetch(`${BASE_URL}/assignments/users/${userId}`, {
    headers: getHeaders(),
  });
  const data = await readJson<AssignmentResource[] | { message?: string }>(response);
  if (response.status === 404) return [];
  if (!response.ok) throw new Error(!Array.isArray(data) ? data?.message || 'Error al obtener asignaciones' : 'Error al obtener asignaciones');
  return data as AssignmentResource[];
};

export const getTopCandidates = async (taskId: number, teamId: number) => {
  const response = await fetch(`${BASE_URL}/assignments/recommend/${taskId}/team/${teamId}`, {
    headers: getHeaders(),
  });
  const data = await readJson<CandidateProfileResource[] | { message?: string }>(response);
  if (response.status === 404) return [];
  if (!response.ok) throw new Error(!Array.isArray(data) ? data?.message || 'Error al obtener recomendación IA' : 'Error al obtener recomendación IA');
  return data as CandidateProfileResource[];
};

export const confirmRecommendation = async (taskId: number, userId: number) => {
  const response = await fetch(`${BASE_URL}/assignments/recommend/confirm`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ taskId, userId }),
  });
  const data = await readJson<AssignmentResource | { message?: string }>(response);
  if (!response.ok) throw new Error(!(data && 'id' in data) ? data?.message || 'Error al confirmar asignación' : 'Error al confirmar asignación');
  return data as AssignmentResource;
};
