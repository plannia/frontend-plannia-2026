import { test, expect } from '@playwright/test';
import { seedTeamWithMembers, apiLogin, createCategoryApi, loginViaUI, API, PASSWORD } from './helpers';

test('Borde: crear tarea con horas inválidas (0/negativas) no debe romper la UI', async ({ page, request }) => {
  const seed = await seedTeamWithMembers(request, [
    { name: 'Fede Backend', abilities: 'Java, Spring Boot', interests: 'Backend' },
  ]);
  const { token } = await apiLogin(request, seed.email);
  const catName = `EdgeCat ${Date.now()}`;
  await createCategoryApi(request, token, seed.teamId, catName);

  await loginViaUI(page, seed.email);
  await page.getByRole('button', { name: 'Gestión de Tareas' }).click();
  await page.getByRole('button', { name: /Agregar Tarea/ }).click();

  const dialog = page.locator('.fixed.inset-0').filter({ hasText: 'Nueva Tarea' });
  await dialog.getByPlaceholder('Ej: Implementar módulo de pagos').fill(`Tarea horas malas ${Date.now()}`);
  await dialog.locator('select').first().selectOption(catName);
  await dialog.getByPlaceholder('Ej: 8').fill('-5');           // horas negativas
  await dialog.locator('input[type="date"]').fill('2026-12-20');
  await dialog.getByRole('button', { name: /^Crear Tarea$/ }).click();

  // El backend exige hours > 0. La app debe manejarlo: o muestra error claro, o no crea la tarea.
  // Lo que NO debe pasar: que parezca creada o que la UI quede colgada/rota.
  await expect(
    page.getByText(/No se pudo crear la tarea|Hours must be greater than zero|mayor a cero/i)
  ).toBeVisible({ timeout: 20_000 });
});
