import { test, expect } from '@playwright/test';
import { createTeamViaApi, apiLogin, createCategoryApi, createTaskApi, loginViaUI, API } from './helpers';

test('Líder: editar una tarea (cambiar fecha límite) la persiste', async ({ page, request }) => {
  // Seed por API: equipo + categoría + tarea (limitDate 2026-12-20).
  const lead = await createTeamViaApi(request);
  const { token } = await apiLogin(request, lead.email);
  const catId = await createCategoryApi(request, token, lead.teamId, `EditTaskCat ${Date.now()}`);
  const taskTitle = `Tarea editable ${Date.now()}`;
  const taskId = await createTaskApi(request, token, catId, { title: taskTitle });

  await loginViaUI(page, lead.email);
  await page.getByRole('button', { name: 'Gestión de Tareas' }).click();

  // Abrir el detalle de la tarea y entrar a Editar.
  const row = page.locator('tr', { hasText: taskTitle });
  await expect(row).toBeVisible({ timeout: 30_000 });
  await row.getByText(taskTitle).click();
  await page.getByRole('button', { name: 'Editar' }).click();
  await expect(page.getByText('Editar tarea')).toBeVisible({ timeout: 15_000 });

  // Cambiar la fecha límite y guardar.
  const dialog = page.locator('.fixed.inset-0').filter({ hasText: 'Editar tarea' });
  await dialog.locator('input[type="date"]').fill('2026-11-15');
  await dialog.getByRole('button', { name: 'Guardar cambios' }).click();

  // updateTask (PUT /tasks) persistió la nueva fecha.
  await expect.poll(async () => {
    const res = await request.get(`${API}/tasks/teams/${lead.teamId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const tasks = await res.json();
    const t = tasks.find((x: any) => x.id === taskId);
    return (t?.limitDate ?? '') as string;
  }, { timeout: 20_000 }).toContain('2026-11-15');
});
