import { test, expect } from '@playwright/test';
import { seedMemberWithAssignedTask, loginViaUI } from './helpers';

test('Miembro: ve su tarea asignada en "Mis Tareas" y cambia su estado', async ({ page, request }) => {
  const seed = await seedMemberWithAssignedTask(request, { memberName: 'Tobi Miembro' });

  await loginViaUI(page, seed.memberEmail);
  await page.locator('nav').getByRole('button', { name: 'Mis Tareas' }).click();

  // La tarea asignada aparece en la lista del miembro.
  const row = page.getByText(seed.taskTitle);
  await expect(row).toBeVisible({ timeout: 30_000 });

  // Abrir el detalle y mover el estado a "En progreso".
  await row.click();
  await page.getByRole('button', { name: 'En progreso' }).click();
  await page.getByRole('button', { name: 'Guardar cambios' }).click();

  // El estado se refleja (updateTask OK). "En progreso" visible en la lista/detalle.
  await expect(page.getByText('En progreso').first()).toBeVisible({ timeout: 30_000 });
});
