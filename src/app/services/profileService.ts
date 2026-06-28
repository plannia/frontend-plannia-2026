import BASE_URL, { getHeaders } from './api';

export interface TaskStatusCounts {
  toDoCount: number;
  inProgressCount: number;
  doneCount: number;
}

export interface UserDetailResult {
  id: number;
  name: string;
  email: string;
  position: string;
  role: 'LEADER' | 'MEMBER';
  teamId: number;
  profile: {
    id: number;
    userId: number;
    teamId: number;
    maxHours: number;
    abilities: string[];   // ya convertido a array
    interests: string[];   // ya convertido a array
    activeHours: number;
  };
  taskStatusCounts: TaskStatusCounts;
}

export interface MemberProfileResult {
  id: number;
  userId: number;
  teamId: number;
  maxHours: number;
  abilities: string[];
  interests: string[];
  activeHours: number;
}



// ============================================================
// HELPERS internos de conversión (string csv <-> array)
// ============================================================

const csvToArray = (s: string | null | undefined): string[] =>
  s ? s.split(',').map(x => x.trim()).filter(Boolean) : [];

const arrayToCsv = (arr: string[]): string => arr.join(', ');

// ============================================================
// LECTURA — perfil propio (sirve para LEADER y MEMBER, es el mismo endpoint)
// GET /api/v1/users/{userId}
// ============================================================

export async function getUserDetail(userId: number): Promise<UserDetailResult> {
  const res = await fetch(`${BASE_URL}/users/${userId}`, {
    method: 'GET',
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('No se pudo obtener el perfil del usuario');
  const data = await res.json();

  return {
    ...data,
    profile: {
      id: data.profile?.id ?? null,
      userId: data.id,
      teamId: data.teamId,
      maxHours: data.profile?.maxHours ?? 0,
      abilities: csvToArray(data.profile?.abilities),
      interests: csvToArray(data.profile?.interests),
      activeHours: data.profile?.activeHours ?? 0,
    },
  };
}

// ============================================================
// ESCRITURA — perfil propio (maxHours, abilities, interests)
// PUT /api/v1/member-profiles/users/{userId}
// Usado tanto por LEADER como por MEMBER para editar SU propio perfil
// ============================================================

export async function updateMemberProfile(
  userId: number,
  data: { maxHours: number; abilities: string[]; interests: string[] }
) {
  const res = await fetch(`${BASE_URL}/member-profiles/users/${userId}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({
      maxHours: data.maxHours,
      abilities: data.abilities.join(', '),
      interests: data.interests.join(', '),
    }),
  });

  if (!res.ok) throw new Error('No se pudo actualizar el perfil');

  // algunos backends devuelven el body vacío en un 200/204 — evitamos que truene
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

// ============================================================
// SOLO LEADER — ver perfiles de TODO el equipo
// GET /api/v1/member-profiles/teams/{teamId}
// ============================================================

export async function getTeamProfiles(teamId: number): Promise<MemberProfileResult[]> {
  const res = await fetch(`${BASE_URL}/member-profiles/teams/${teamId}`, {
    method: 'GET',
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('No se pudieron obtener los perfiles del equipo');
  const data = await res.json();

  return data.map((p: any) => ({
    ...p,
    abilities: csvToArray(p.abilities),
    interests: csvToArray(p.interests),
  }));
}

// ============================================================
// SOLO LEADER — editar name/email/position de un miembro
// PUT /api/v1/users/{userId}
// (tu propia UI ya dice: "solo el líder puede modificar nombre, cargo y email")
// ============================================================

export async function updateUserBasicInfo(
  userId: number,
  data: { name?: string; email?: string; position?: string; password?: string }
) {
  const res = await fetch(`${BASE_URL}/users/${userId}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('No se pudo actualizar la información del usuario');
  return res.json();
}

// ============================================================
// Extras del dominio member-profiles (por si los necesitas más adelante)
// ============================================================

// PATCH /api/v1/member-profiles/users/{userId}/max-hours
export async function updateMaxHours(userId: number, maxHours: number) {
  const res = await fetch(`${BASE_URL}/member-profiles/users/${userId}/max-hours`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify({ maxHours }),
  });
  if (!res.ok) throw new Error('No se pudo actualizar el máximo de horas');
  return res.json();
}

// PATCH /api/v1/member-profiles/users/{userId}/active-hours/reduce
export async function reduceActiveHours(userId: number, hours: number) {
  const res = await fetch(`${BASE_URL}/member-profiles/users/${userId}/active-hours/reduce`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify({ hours }),
  });
  if (!res.ok) throw new Error('No se pudo reducir las horas activas');
  return res.json();
}

export async function createMemberProfile(data: {
  userId: number;
  teamId: number;
  maxHours: number;
  abilities: string[];
  interests: string[];
}) {
  const res = await fetch(`${BASE_URL}/member-profiles`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      userId: data.userId,
      teamId: data.teamId,
      maxHours: data.maxHours,
      abilities: data.abilities.join(', '),
      interests: data.interests.join(', '),
    }),
  });
  if (!res.ok) throw new Error('No se pudo crear el perfil del miembro');
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}