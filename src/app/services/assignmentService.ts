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

const readJson = async (response: Response) => {
  const text = await response.text();
  return text ? JSON.parse(text) : null;
};

const assertOk = async <T>(response: Response, fallback: string): Promise<T> => {
  const data = await readJson(response);
  if (!response.ok) throw new Error(data?.message || fallback);
  return data;
};

export const getAssignmentCandidates = async (taskId: number, teamId: number) => {
  const response = await fetch(`${BASE_URL}/assignments/recommend/${taskId}/team/${teamId}`, {
    headers: getHeaders(),
  });
  return assertOk<CandidateProfileResource[]>(response, 'Error al obtener candidatos de asignación');
};

export const confirmAssignmentRecommendation = async (taskId: number, userId: number) => {
  const response = await fetch(`${BASE_URL}/assignments/recommend/confirm`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ taskId, userId }),
  });
  return assertOk<AssignmentResource>(response, 'Error al confirmar asignación');
};

export const completeAssignment = async (taskId: number) => {
  const response = await fetch(`${BASE_URL}/assignments/complete/${taskId}`, {
    method: 'PATCH',
    headers: getHeaders(),
  });
  return assertOk<AssignmentResource>(response, 'Error al completar asignación');
};
