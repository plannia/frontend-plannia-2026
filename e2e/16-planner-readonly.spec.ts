import { test, expect } from '@playwright/test';
import { createTeamViaApi, apiLogin, createCategoryApi, loginViaUI, uniqueEmail, PASSWORD, API } from './helpers';

// NOTA: el drag-and-drop del Planner está deshabilitado (canEditSchedule=false, sin endpoint para
// persistir startTime/endTime). Es una vista de SOLO LECTURA. Este test cubre lo testeable: que el
// planner agregue y muestre las tareas asignadas del equipo y que la navegación de fecha filtre.
test('Líder: el Planificador muestra la tarea asignada del miembro en la fecha correcta', async ({ page, request }) => {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const lead = await createTeamViaApi(request);
  const memberEmail = uniqueEmail('mem');
  const memberName = 'Pia Planner';
  await request.post(`${API}/authentication/sign-up`, {
    data: { name: memberName, email: memberEmail, password: PASSWORD, position: 'Dev', code: lead.code },
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
  const taskTitle = `Tarea planner ${Date.now()}`;
  const taskRes = await request.post(`${API}/tasks`, {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      categoryId: catId, title: taskTitle, description: 'Spring Boot backend', hours: 3,
      priority: 'HIGH', difficulty: 'MEDIUM', limitDate: `${today}T12:00:00`, tools: [], knowledge: [],
    },
  });
  const taskId = (await taskRes.json()).id;
  await request.post(`${API}/assignments/recommend/confirm`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { taskId, userId: memberId },
  });

  await loginViaUI(page, lead.email);
  await page.locator('nav').getByRole('button', { name: 'Planificador' }).click();
  await expect(page.getByRole('heading', { name: 'Planificador de Equipo' })).toBeVisible({ timeout: 30_000 });

  // El miembro y su tarea (fecha = hoy) aparecen en el timeline.
  await expect(page.getByText(memberName).first()).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText(taskTitle)).toBeVisible();

  // Navegar al día siguiente: la tarea (solo de hoy) desaparece; el miembro sigue.
  await page.getByRole('button', { name: 'Hoy' }).locator('xpath=following-sibling::button[1]').click();
  await expect(page.getByText(taskTitle)).toBeHidden();
  await expect(page.getByText(memberName).first()).toBeVisible();
});
