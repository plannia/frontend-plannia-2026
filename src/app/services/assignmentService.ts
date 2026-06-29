import BASE_URL, { getHeaders } from './api';

export interface CandidateProfileResource {
  userId: number;
  activeHours: number;
  maxHours: number;
  availableHours: number;
}

export interface AssignmentResource {
  id: number;
  userId: number;
  taskId: number;
  skillMatch: number;
  experienceMatch: number;
  interestMatch: number;
  score: number;
  status: string;
}

export const getRecommendedCandidates = async (
  taskId: number,
  teamId: number
): Promise<CandidateProfileResource[]> => {
  const response = await fetch(`${BASE_URL}/assignments/recommend/${taskId}/team/${teamId}`, {
    headers: getHeaders(),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Error al obtener candidatos');
  return data;
};

export const confirmAssignmentRecommendation = async (
  taskId: number,
  userId: number
): Promise<AssignmentResource> => {
  const response = await fetch(`${BASE_URL}/assignments/recommend/confirm`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ taskId, userId }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Error al confirmar asignación');
  return data;
};

export const getAssignmentsByUser = async (userId: number): Promise<AssignmentResource[]> => {
  const response = await fetch(`${BASE_URL}/assignments/users/${userId}`, {
    headers: getHeaders(),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Error al obtener asignaciones');
  return data;
};

export const completeAssignment = async (taskId: number): Promise<AssignmentResource> => {
  const response = await fetch(`${BASE_URL}/assignments/complete/${taskId}`, {
    method: 'PATCH',
    headers: getHeaders(),
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) throw new Error(data.message || 'Error al completar asignación');
  return data;
};
