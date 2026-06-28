import BASE_URL, { getHeaders } from './api';

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
}

export interface CreateTaskPayload {
  categoryId: number;
  title: string;
  description: string;
  hours: number;
  priority: string;
  difficulty: string;
  limitDate: string;
  tools: string[];
  knowledge: string[];
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

export const getTasksByTeam = async (teamId: number, filters: Record<string, string> = {}) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });

  const query = params.toString();
  const response = await fetch(`${BASE_URL}/tasks/teams/${teamId}${query ? `?${query}` : ''}`, {
    headers: getHeaders(),
  });
  return assertOk<TaskResource[]>(response, 'Error al obtener tareas');
};

export const createTask = async (payload: CreateTaskPayload) => {
  const response = await fetch(`${BASE_URL}/tasks`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  return assertOk<TaskResource>(response, 'Error al crear tarea');
};

export const updateTask = async (taskId: number, payload: { status: string; limitDate: string }) => {
  const response = await fetch(`${BASE_URL}/tasks/${taskId}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  return assertOk<TaskResource>(response, 'Error al actualizar tarea');
};
