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

export function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(String).map(s => s.trim()).filter(Boolean);
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed.map(String).map(s => s.trim()).filter(Boolean);
        }
      } catch {
        // fallback to CSV parsing
      }
    }
    return trimmed.split(',').map(s => s.trim()).filter(Boolean);
  }
  return [];
}

const arrayToCsv = (arr: string[]): string => arr.join(', ');

async function readErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const body = await res.json();
    if (typeof body?.message === 'string' && body.message.trim()) {
      return body.message;
    }
  } catch {
    // ignore parse errors
  }
  return fallback;
}

// ============================================================
// LECTURA — perfil propio (sirve para LEADER y MEMBER, es el mismo endpoint)
// GET /api/v1/users/{userId} + GET /api/v1/member-profiles/users/{userId}
// ============================================================

export async function getUserDetail(userId: number): Promise<UserDetailResult> {
  const headers = getHeaders();
  const [userRes, memberProfileRes] = await Promise.all([
    fetch(`${BASE_URL}/users/${userId}`, { method: 'GET', headers }),
    fetch(`${BASE_URL}/member-profiles/users/${userId}`, { method: 'GET', headers }),
  ]);

  if (!userRes.ok) throw new Error('No se pudo obtener el perfil del usuario');
  const data = await userRes.json();
  const memberProfile = memberProfileRes.ok ? await memberProfileRes.json() : null;
  const profileSource = memberProfile ?? data.profile;

  return {
    ...data,
    profile: {
      id: profileSource?.id ?? data.profile?.id ?? null,
      userId: data.id,
      teamId: profileSource?.teamId ?? data.teamId,
      maxHours: profileSource?.maxHours ?? data.profile?.maxHours ?? 0,
      abilities: toStringArray(profileSource?.abilities ?? data.profile?.abilities),
      interests: toStringArray(profileSource?.interests ?? data.profile?.interests),
      activeHours: profileSource?.activeHours ?? data.profile?.activeHours ?? 0,
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

  if (!res.ok) {
    throw new Error(await readErrorMessage(res, 'No se pudo actualizar el perfil'));
  }

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
  if (res.status === 401) throw new Error('SESSION_EXPIRED');
  if (!res.ok) throw new Error('No se pudieron obtener los perfiles del equipo');
  const data = await res.json();

  return data.map((p: MemberProfileResult & { abilities?: unknown; interests?: unknown }) => ({
    ...p,
    abilities: toStringArray(p.abilities),
    interests: toStringArray(p.interests),
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