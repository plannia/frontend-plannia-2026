import { Page, APIRequestContext, expect } from '@playwright/test';

export const PASSWORD = 'Password123!';
export const API = 'https://plannia-eabkf7dna7g7dqhc.eastus-01.azurewebsites.net/api/v1';

// Crea un equipo por API (setup rápido, sin UI) y devuelve { code, teamId, email }.
export async function createTeamViaApi(request: APIRequestContext, teamName = `API Team ${Date.now()}`) {
  const email = uniqueEmail('apilead');
  const res = await request.post(`${API}/teams`, {
    data: { teamName, email, leaderName: 'API Lead', password: PASSWORD },
  });
  if (!res.ok()) throw new Error(`createTeam API failed: ${res.status()}`);
  const body = await res.json();
  return { code: body.code as string, teamId: body.id as number, email };
}

type MemberSpec = { name: string; abilities: string; interests: string };

// Seedea un equipo + N miembros con perfil completo (embeddings) por API, para que las
// recomendaciones devuelvan candidatos. Devuelve credenciales del líder + datos de los miembros.
export async function seedTeamWithMembers(request: APIRequestContext, specs: MemberSpec[]) {
  const lead = await createTeamViaApi(request, `JTeam ${Date.now()}`);
  const members: { name: string; email: string; userId: number }[] = [];
  for (const spec of specs) {
    const email = uniqueEmail('mem');
    await request.post(`${API}/authentication/sign-up`, {
      data: { name: spec.name, email, password: PASSWORD, position: 'Dev', code: lead.code },
    });
    const si = await request.post(`${API}/authentication/sign-in`, { data: { email, password: PASSWORD } });
    const { user, token } = await si.json();
    const put = await request.put(`${API}/member-profiles/users/${user.id}`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { maxHours: 40, abilities: spec.abilities, interests: spec.interests },
    });
    if (!put.ok()) throw new Error(`profile PUT failed for ${spec.name}: ${put.status()}`);
    members.push({ name: spec.name, email, userId: user.id });
  }
  return { ...lead, members };
}

// Login por API → devuelve { token, userId }.
export async function apiLogin(request: APIRequestContext, email: string, password = PASSWORD) {
  const res = await request.post(`${API}/authentication/sign-in`, { data: { email, password } });
  if (!res.ok()) throw new Error(`sign-in API failed: ${res.status()}`);
  const { user, token } = await res.json();
  return { token: token as string, userId: user.id as number };
}

export async function createCategoryApi(request: APIRequestContext, token: string, teamId: number, name = `Cat ${Date.now()}`) {
  const res = await request.post(`${API}/categories`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { teamId, name, limitDate: '2026-12-31T18:00:00' },
  });
  if (!res.ok()) throw new Error(`createCategory API failed: ${res.status()}`);
  return (await res.json()).id as number;
}

export async function createTaskApi(
  request: APIRequestContext, token: string, categoryId: number,
  opts: { title: string; hours?: number; priority?: string; difficulty?: string; description?: string }
) {
  const res = await request.post(`${API}/tasks`, {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      categoryId,
      title: opts.title,
      description: opts.description ?? 'Spring Boot Java JPA REST PostgreSQL backend service',
      hours: opts.hours ?? 6,
      priority: opts.priority ?? 'HIGH',
      difficulty: opts.difficulty ?? 'MEDIUM',
      limitDate: '2026-12-20T12:00:00',
      tools: [], knowledge: [],
    },
  });
  if (!res.ok()) throw new Error(`createTask API failed: ${res.status()}`);
  return (await res.json()).id as number;
}

// Seedea un equipo + 1 miembro con perfil + una tarea ASIGNADA a ese miembro (todo por API).
export async function seedMemberWithAssignedTask(
  request: APIRequestContext,
  opts?: { memberName?: string; taskTitle?: string }
) {
  const lead = await createTeamViaApi(request);
  const memberEmail = uniqueEmail('mem');
  const memberName = opts?.memberName ?? 'Miembro E2E';
  await request.post(`${API}/authentication/sign-up`, {
    data: { name: memberName, email: memberEmail, password: PASSWORD, position: 'Dev', code: lead.code },
  });
  const si = await request.post(`${API}/authentication/sign-in`, { data: { email: memberEmail, password: PASSWORD } });
  const member = await si.json();
  const memberId = member.user.id as number;
  await request.put(`${API}/member-profiles/users/${memberId}`, {
    headers: { Authorization: `Bearer ${member.token}` },
    data: { maxHours: 40, abilities: 'Java, Spring Boot, REST', interests: 'Backend' },
  });

  const { token } = await apiLogin(request, lead.email);
  const catId = await createCategoryApi(request, token, lead.teamId);
  const taskTitle = opts?.taskTitle ?? `Tarea miembro ${Date.now()}`;
  const taskId = await createTaskApi(request, token, catId, { title: taskTitle });
  const asg = await request.post(`${API}/assignments/recommend/confirm`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { taskId, userId: memberId },
  });
  if (!asg.ok()) throw new Error(`assign failed: ${asg.status()}`);

  return { memberEmail, memberId, taskTitle, taskId, teamId: lead.teamId };
}

// Inicia sesión por la UI con un usuario existente. El rol lo determina el backend (user.role).
export async function loginViaUI(page: Page, email: string, password = PASSWORD) {
  await page.goto('/');
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole('button', { name: /^Iniciar sesión$/ }).click();
}

// Email único por corrida para no chocar con datos previos en el backend de prod.
export function uniqueEmail(prefix: string): string {
  return `${prefix}_${Date.now()}@e2e.test`;
}

// Crea un equipo desde la UI (líder) y devuelve { email, code }.
export async function createTeamViaUI(page: Page, opts?: { teamName?: string; leaderName?: string }) {
  const email = uniqueEmail('lead');
  const teamName = opts?.teamName ?? `E2E Team ${Date.now()}`;
  const leaderName = opts?.leaderName ?? 'Lider E2E';

  await page.goto('/');
  await page.getByRole('button', { name: /Crea tu equipo aquí/ }).click();

  await page.getByPlaceholder('Ej: Agencia Creativa XYZ').fill(teamName);
  await page.getByPlaceholder('Ej: María González').fill(leaderName);
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(PASSWORD);
  await page.getByPlaceholder('Ej: React, Liderazgo, Scrum').fill('Java, Spring Boot, Liderazgo');
  await page.getByPlaceholder('Ej: UX, IA, Gestión de equipos').fill('Backend, Gestión de equipos');

  await page.getByRole('button', { name: /Registrar y Crear Equipo/ }).click();

  // El modal de éxito aparece tras crear equipo + sign-in + crear perfil (embeddings, puede tardar).
  await expect(page.getByText('¡Equipo creado con éxito!')).toBeVisible({ timeout: 60_000 });

  // El código está en un <span> con texto en gradiente (transparente); lo leemos del DOM.
  const code = await page.evaluate(() => {
    const label = Array.from(document.querySelectorAll('p'))
      .find(p => p.textContent?.trim() === 'Código de acceso');
    return label?.parentElement?.querySelector('span')?.textContent?.trim() ?? '';
  });

  return { email, code, teamName, leaderName };
}
