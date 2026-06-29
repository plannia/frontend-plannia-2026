import BASE_URL, { getHeaders } from './api';

export interface TaskResource {
  id: number;
  categoryId: number;
  title: string;
  description: string;
  hours: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  status: 'TO_DO' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED';
  limitDate: string;
  tools: string[];
  knowledge: string[];
  startTime?: string;
  endTime?: string;
}

export interface CreateTaskResource {
  categoryId: number;
  title: string;
  description: string;
  hours: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  limitDate: string;
  tools: string[];
  knowledge: string[];
}

export interface UpdateTaskResource {
  status: 'TO_DO' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED';
  limitDate: string;
}

export const getTasksByTeam = async (
  teamId: number,
  filters?: { categoryId?: number; status?: string; userId?: number; title?: string; description?: string; priority?: string; difficulty?: string }
): Promise<TaskResource[]> => {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') params.append(key, String(value));
    });
  }
  const query = params.toString() ? `?${params.toString()}` : '';
  const response = await fetch(`${BASE_URL}/tasks/teams/${teamId}${query}`, {
    headers: getHeaders(),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Error al obtener tareas');
  return data;
};

export const createTask = async (task: CreateTaskResource): Promise<TaskResource> => {
  const response = await fetch(`${BASE_URL}/tasks`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(task),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Error al crear tarea');
  return data;
};

export const updateTask = async (taskId: number, task: UpdateTaskResource): Promise<TaskResource> => {
  const response = await fetch(`${BASE_URL}/tasks/${taskId}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(task),
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) throw new Error(data.message || 'Error al actualizar tarea');
  return data;
};
