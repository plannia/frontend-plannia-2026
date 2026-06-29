import { test, expect } from '@playwright/test';
import { seedTeamWithMembers, apiLogin, createCategoryApi, createTaskApi, loginViaUI } from './helpers';

test('Líder: el modal de asignación rankea candidatos y permite override manual', async ({ page, request }) => {
  // Equipo con 2 perfiles distintos: para una tarea backend, "Ana Backend" debe rankear #1.
  const seed = await seedTeamWithMembers(request, [
    { name: 'Ana Backend', abilities: 'Java, Spring Boot, JPA, REST, PostgreSQL', interests: 'Backend, APIs' },
    { name: 'Beto Frontend', abilities: 'React, TypeScript, CSS, UI', interests: 'Frontend, diseño' },
  ]);
  const { token } = await apiLogin(request, seed.email);
  const catId = await createCategoryApi(request, token, seed.teamId);
  const taskTitle = `Tarea backend rank ${Date.now()}`;
  await createTaskApi(request, token, catId, {
    title: taskTitle, description: 'Spring Boot REST endpoints con JPA y PostgreSQL backend', priority: 'HIGH',
  });

  await loginViaUI(page, seed.email);
  await page.getByRole('button', { name: 'Gestión de Tareas' }).click();

  const row = page.locator('tr', { hasText: taskTitle });
  await expect(row).toBeVisible({ timeout: 30_000 });
  await row.getByRole('button', { name: 'Asignar' }).click();

  const dialog = page.locator('.fixed.inset-0').filter({ hasText: 'Asignar tarea' });
  await expect(dialog.getByText('Buscando candidatos...')).toBeHidden({ timeout: 40_000 });

  // Ranking: ambos candidatos aparecen y el #1 tiene el badge "Mejor opción".
  await expect(dialog.getByText(/Mejor opción/)).toBeVisible();
  await expect(dialog.getByText(/Ana Backend/)).toBeVisible();
  await expect(dialog.getByText(/Beto Frontend/)).toBeVisible();

  // Override manual: elijo a Beto (NO el #1 recomendado) y confirmo.
  await dialog.getByRole('button', { name: /Beto Frontend/ }).click();
  await dialog.getByRole('button', { name: /Confirmar asignación/ }).click();

  // La tarea queda asignada a quien elegí manualmente (Beto), no al recomendado.
  await expect(row.getByText('Beto Frontend')).toBeVisible({ timeout: 30_000 });
});
