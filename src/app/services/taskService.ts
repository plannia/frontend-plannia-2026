import BASE_URL, { getHeaders, readJson } from './api';

export interface TaskResource {
  id: number;
  categoryId: number;
  title: string;
  description?: string;
  hours: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | string;
  status: 'TO_DO' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED' | string;
  limitDate?: string;
  tools?: string[];
  knowledge?: string[];
  startTime?: string;
  endTime?: string;
}

export interface CreateTaskPayload {
  categoryId: number;
  title: string;
  description?: string;
  hours: number;
  priority: string;
  difficulty: string;
  limitDate: string;
  tools: string[];
  knowledge: string[];
}

export const getTasksByTeam = async (teamId: number) => {
  const response = await fetch(`${BASE_URL}/tasks/teams/${teamId}`, {
    headers: getHeaders(),
  });
  const data = await readJson<TaskResource[] | { message?: string }>(response);
  if (!response.ok) throw new Error(!Array.isArray(data) ? data?.message || 'Error al obtener tareas' : 'Error al obtener tareas');
  return data as TaskResource[];
};

export const createTask = async (payload: CreateTaskPayload) => {
  const response = await fetch(`${BASE_URL}/tasks`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await readJson<TaskResource | { message?: string }>(response);
  if (!response.ok) throw new Error(!(data && 'id' in data) ? data?.message || 'Error al crear tarea' : 'Error al crear tarea');
  return data as TaskResource;
};

export const updateTask = async (taskId: number, status: string, limitDate?: string) => {
  const response = await fetch(`${BASE_URL}/tasks/${taskId}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ status, limitDate }),
  });
  const data = await readJson<TaskResource | { message?: string }>(response);
  if (!response.ok) throw new Error(!(data && 'id' in data) ? data?.message || 'Error al actualizar tarea' : 'Error al actualizar tarea');
  return data as TaskResource;
};
