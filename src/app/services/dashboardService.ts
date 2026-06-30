import BASE_URL, { getHeaders } from './api';

export interface DashboardTask {
  userId: number;
  userName: string;
  taskId: number;
  taskName: string;
  taskStatus: 'TO_DO' | 'IN_PROGRESS' | 'DONE';
  taskStartTime: string;
  taskEndTime?: string | null;
  taskHours: number;
  taskCategoryId: number;
  taskCategoryName: string;
}

export interface DashboardMemberProfile {
  id: number;
  userId: number;
  teamId: number;
  maxHours: number;
  abilities: string;
  interests: string;
  activeHours: number;
}

export const getDashboardTasks = async (teamId: number): Promise<DashboardTask[]> => {
  const response = await fetch(`${BASE_URL}/tasks/dashboard/teams/${teamId}`, {
    headers: getHeaders(),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Error al obtener tareas');
  return data as DashboardTask[];
};

export const getPlannerTasks = async (teamId: number): Promise<DashboardTask[]> => {
  const response = await fetch(`${BASE_URL}/tasks/planner/teams/${teamId}`, {
    headers: getHeaders(),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Error al obtener tareas del planificador');
  return data as DashboardTask[];
};

export const getMemberProfiles = async (teamId: number): Promise<DashboardMemberProfile[]> => {
  const response = await fetch(`${BASE_URL}/member-profiles/teams/${teamId}`, {
    headers: getHeaders(),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Error al obtener perfiles');
  return data as DashboardMemberProfile[];
};