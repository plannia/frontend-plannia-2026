import { test, expect } from '@playwright/test';
import { createTeamViaApi, apiLogin, createCategoryApi, createTaskApi, loginViaUI, uniqueEmail, PASSWORD, API } from './helpers';

test('Borde: asignar una tarea sin candidatos elegibles muestra un mensaje claro', async ({ page, request }) => {
  // Equipo + 1 miembro SIN completar perfil (sin embeddings → no es candidato).
  const lead = await createTeamViaApi(request);
  const memberEmail = uniqueEmail('noprofile');
  await request.post(`${API}/authentication/sign-up`, {
    data: { name: 'Sin Perfil', email: memberEmail, password: PASSWORD, position: 'Dev', code: lead.code },
  });
  const { token } = await apiLogin(request, lead.email);
  const catId = await createCategoryApi(request, token, lead.teamId);
  const taskTitle = `Tarea sin candidatos ${Date.now()}`;
  await createTaskApi(request, token, catId, { title: taskTitle });

  await loginViaUI(page, lead.email);
  await page.getByRole('button', { name: 'Gestión de Tareas' }).click();

  const row = page.locator('tr', { hasText: taskTitle });
  await expect(row).toBeVisible({ timeout: 30_000 });
  await row.getByRole('button', { name: 'Asignar' }).click();

  // Debe terminar de buscar y mostrar un estado claro de "sin candidatos".
  const dialog = page.locator('.fixed.inset-0').filter({ hasText: 'Asignar tarea' });
  await expect(dialog.getByText('Buscando candidatos...')).toBeHidden({ timeout: 40_000 });
  await expect(dialog.getByText(/No hay candidatos|No se encontraron candidatos|No se pudieron obtener/i)).toBeVisible();
});
