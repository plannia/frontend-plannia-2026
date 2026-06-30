import { test, expect } from '@playwright/test';
import { createTeamViaApi, uniqueEmail, PASSWORD } from './helpers';

test('Miembro: unirse con código entra a la app de miembro', async ({ page, request }) => {
  // Setup por API: un equipo con su código.
  const { code } = await createTeamViaApi(request);
  const email = uniqueEmail('member');

  await page.goto('/');
  await page.getByRole('button', { name: /Únete a un equipo/ }).click();

  await page.getByPlaceholder('Ej: Carlos Rodríguez').fill('Miembro E2E');
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(PASSWORD);
  await page.getByPlaceholder('Ej: Desarrollador Frontend').fill('Desarrollador');
  await page.getByPlaceholder('Ej: PLA640007').fill(code);

  await page.getByRole('button', { name: /^Unirse al equipo$/ }).click();

  // Cae en la app de miembro: el menú lateral tiene "Mis Tareas" (exclusivo del miembro).
  await expect(page.getByText('Mis Tareas').first()).toBeVisible({ timeout: 30_000 });
});
