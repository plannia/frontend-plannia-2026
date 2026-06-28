import BASE_URL, { getHeaders } from './api';

export interface MemberProfileResource {
  id: number;
  userId: number;
  teamId: number;
  maxHours: number;
  abilities: string;
  interests: string;
  activeHours: number;
}

export const getAllMemberProfiles = async () => {
  const response = await fetch(`${BASE_URL}/member-profiles`, {
    headers: getHeaders(),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Error al obtener perfiles');
  return data as MemberProfileResource[];
};

export const getMemberProfileByUserId = async (userId: number) => {
  const response = await fetch(`${BASE_URL}/member-profiles/users/${userId}`, {
    headers: getHeaders(),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Error al obtener perfil de miembro');
  return data as MemberProfileResource;
};

export const createMemberProfile = async (payload: {
  userId: number;
  teamId: number;
  maxHours: number;
  abilities: string;
  interests: string;
}) => {
  const response = await fetch(`${BASE_URL}/member-profiles`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Error al crear perfil de miembro');
  return data as MemberProfileResource;
};

export const updateMemberProfile = async (
  userId: number,
  payload: { maxHours: number; abilities: string; interests: string }
) => {
  const response = await fetch(`${BASE_URL}/member-profiles/users/${userId}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Error al actualizar perfil de miembro');
  return data as MemberProfileResource;
};

export const updateMemberProfileMaxHours = async (userId: number, maxHours: number) => {
  const response = await fetch(`${BASE_URL}/member-profiles/users/${userId}/max-hours`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify({ maxHours }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Error al actualizar horas máximas');
  return data as MemberProfileResource;
};

export const reduceMemberProfileActiveHours = async (userId: number, hours: number) => {
  const response = await fetch(`${BASE_URL}/member-profiles/users/${userId}/active-hours/reduce`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify({ hours }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Error al reducir horas activas');
  return data as MemberProfileResource;
};
