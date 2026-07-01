import { test, expect } from '@playwright/test';
import { createTeamViaApi, apiLogin, createCategoryApi, createTaskApi, loginViaUI, uniqueEmail, PASSWORD, API } from './helpers';

// El líder organiza, no se le recomiendan tareas: aunque tenga un perfil con skills, NO debe aparecer
// como candidato en el modal "Asignar tarea" (ni en el auto-assign). Solo los miembros. (Backend: el
// pool de candidatos excluye al userId con role=LEADER — ver TeamLeadershipPort.)
test('Líder con perfil NO aparece como candidato; los miembros sí', async ({ page, request }) => {
  const lead = await createTeamViaApi(request); // leaderName = 'API Lead'
  const { token, userId: leaderId } = await apiLogin(request, lead.email);

  // El líder completa su perfil con skills backend (esto ANTES lo volvía candidato).
  await request.put(`${API}/member-profiles/users/${leaderId}`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { maxHours: 40, abilities: 'Java, Spring Boot, JPA, PostgreSQL, REST', interests: 'Backend, APIs' },
  });

  // Un miembro con skills backend equivalentes.
  const memberEmail = uniqueEmail('mem');
  const memberName = 'Marco Miembro';
  await request.post(`${API}/authentication/sign-up`, {
    data: { name: memberName, email: memberEmail, password: PASSWORD, position: 'Dev', code: lead.code },
  });
  const si = await request.post(`${API}/authentication/sign-in`, { data: { email: memberEmail, password: PASSWORD } });
  const member = await si.json();
  await request.put(`${API}/member-profiles/users/${member.user.id}`, {
    headers: { Authorization: `Bearer ${member.token}` },
    data: { maxHours: 40, abilities: 'Java, Spring Boot, JPA, REST', interests: 'Backend' },
  });

  const catId = await createCategoryApi(request, token, lead.teamId);
  const taskTitle = `Tarea backend ${Date.now()}`;
  await createTaskApi(request, token, catId, { title: taskTitle });

  await loginViaUI(page, lead.email);
  await page.getByRole('button', { name: 'Gestión de Tareas' }).click();
  const row = page.locator('tr', { hasText: taskTitle });
  await expect(row).toBeVisible({ timeout: 30_000 });
  await row.getByRole('button', { name: 'Asignar' }).click();

  const dialog = page.locator('.fixed.inset-0').filter({ hasText: 'Asignar tarea' });
  await expect(dialog.getByText('Buscando candidatos...')).toBeHidden({ timeout: 40_000 });

  // El miembro aparece como candidato; el líder ('API Lead') NO, pese a tener skills.
  await expect(dialog.getByText(memberName)).toBeVisible();
  await expect(dialog.getByText('API Lead')).toHaveCount(0);
});
