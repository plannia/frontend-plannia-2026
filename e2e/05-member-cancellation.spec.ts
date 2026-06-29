import { test, expect } from '@playwright/test';
import { seedTeamWithMembers, loginViaUI } from './helpers';

test('Líder: eliminar (cancelar) un miembro del equipo lo quita de la lista', async ({ page, request }) => {
  const seed = await seedTeamWithMembers(request, [
    { name: 'Carlos Cancelable', abilities: 'Python, SQL', interests: 'Data' },
  ]);

  await loginViaUI(page, seed.email);
  await expect(page.locator('nav').getByRole('button', { name: 'Equipo' })).toBeVisible({ timeout: 30_000 });

  // Ir a la sección Equipo y verificar que el miembro está.
  await page.locator('nav').getByRole('button', { name: 'Equipo' }).click();
  await expect(page.getByText('Carlos Cancelable')).toBeVisible({ timeout: 30_000 });

  // La eliminación usa window.confirm → lo aceptamos automáticamente.
  page.on('dialog', dialog => dialog.accept());

  // El único miembro eliminable (el líder no lo es) tiene el botón "Eliminar".
  await page.getByRole('button', { name: /^Eliminar$/ }).click();

  // DELETE /users/{id} → desactiva asignaciones + borra perfil; el miembro desaparece de la lista.
  await expect(page.getByText('Carlos Cancelable')).toBeHidden({ timeout: 30_000 });
});
