import { test, expect } from '@playwright/test';
import { createTeamViaApi, apiLogin, createCategoryApi, createTaskApi, loginViaUI, uniqueEmail, PASSWORD, API } from './helpers';

test('Líder: el Dashboard muestra saludo, carga del equipo y la tarea en progreso', async ({ page, request }) => {
  const lead = await createTeamViaApi(request);
  const memberEmail = uniqueEmail('mem');
  await request.post(`${API}/authentication/sign-up`, {
    data: { name: 'Dani Dashboard', email: memberEmail, password: PASSWORD, position: 'Dev', code: lead.code },
  });
  const si = await request.post(`${API}/authentication/sign-in`, { data: { email: memberEmail, password: PASSWORD } });
  const member = await si.json();
  const memberId = member.user.id as number;
  await request.put(`${API}/member-profiles/users/${memberId}`, {
    headers: { Authorization: `Bearer ${member.token}` },
    data: { maxHours: 40, abilities: 'Java, Spring', interests: 'Backend' },
  });
  const { token } = await apiLogin(request, lead.email);
  const catId = await createCategoryApi(request, token, lead.teamId);
  const taskTitle = `Tarea dashboard ${Date.now()}`;
  const taskId = await createTaskApi(request, token, catId, { title: taskTitle });
  await request.post(`${API}/assignments/recommend/confirm`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { taskId, userId: memberId },
  });
  // Mover a IN_PROGRESS para que aparezca en "Tareas en progreso del equipo".
  await request.put(`${API}/tasks/${taskId}`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { status: 'IN_PROGRESS', limitDate: '2026-12-20T12:00:00' },
  });

  await loginViaUI(page, lead.email); // el Dashboard es la vista por defecto

  // Saludo del líder.
  await expect(page.getByText(/Hola, API/)).toBeVisible({ timeout: 30_000 });
  // Carga del equipo: el perfil del miembro se renderiza (hoy como "Usuario {id}", ver FINDINGS).
  await expect(page.getByText(`Usuario ${memberId}`)).toBeVisible({ timeout: 20_000 });
  // Tarea en progreso del equipo.
  await expect(page.getByText(taskTitle)).toBeVisible();
});
