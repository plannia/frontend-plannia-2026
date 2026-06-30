import { test, expect } from '@playwright/test';
import { seedTeamWithMembers, apiLogin, createCategoryApi, createTaskApi, loginViaUI } from './helpers';

test('Líder: botón "Asignación IA" asigna automáticamente las tareas sin asignar', async ({ page, request }) => {
  // Seed: equipo + 2 miembros con perfil + categoría + 2 tareas backend sin asignar (todo por API).
  const seed = await seedTeamWithMembers(request, [
    { name: 'Dora Backend', abilities: 'Java, Spring Boot, JPA, REST, PostgreSQL', interests: 'Backend, APIs' },
    { name: 'Edu DevOps', abilities: 'Kubernetes, Docker, CI/CD, Azure', interests: 'Infraestructura' },
  ]);
  const { token } = await apiLogin(request, seed.email);
  const catId = await createCategoryApi(request, token, seed.teamId);
  await createTaskApi(request, token, catId, { title: `Bulk task A ${Date.now()}` });
  await createTaskApi(request, token, catId, { title: `Bulk task B ${Date.now()}` });

  await loginViaUI(page, seed.email);
  await page.getByRole('button', { name: 'Gestión de Tareas' }).click();

  // Antes: ambas tareas sin asignar (hay botones "Asignar" en la tabla).
  await expect(page.getByRole('button', { name: 'Asignar' }).first()).toBeVisible({ timeout: 30_000 });

  // Click "Asignación IA": recorre las no asignadas y confirma el #1 recomendado por cada una.
  await page.getByRole('button', { name: /Asignación IA/ }).click();

  // Después: ya no quedan tareas con botón "Asignar" (todas asignadas) y siguen en "Pendiente".
  await expect(page.getByRole('button', { name: 'Asignar' })).toHaveCount(0, { timeout: 60_000 });
  // Las tareas quedan asignadas pero en "Pendiente" (celdas de la tabla, no la opción del filtro).
  await expect(page.getByRole('cell', { name: 'Pendiente' }).first()).toBeVisible();
  await expect(page.getByRole('cell', { name: /Dora Backend/ }).first()).toBeVisible();
});
