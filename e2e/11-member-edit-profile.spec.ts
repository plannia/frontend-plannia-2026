import { test, expect } from '@playwright/test';
import { seedTeamWithMembers, loginViaUI } from './helpers';

test('Miembro: editar su perfil (agregar habilidad) desde la UI la persiste', async ({ page, request }) => {
  const seed = await seedTeamWithMembers(request, [
    { name: 'Mara Miembro', abilities: 'Java, Spring Boot', interests: 'Backend' },
  ]);
  const member = seed.members[0];

  await loginViaUI(page, member.email);
  // App de miembro: nav "Mi Perfil".
  await page.locator('nav').getByRole('button', { name: 'Mi Perfil' }).click();
  await expect(page.getByRole('heading', { name: 'Mi Perfil' })).toBeVisible({ timeout: 30_000 });

  // Abrir editor, agregar una habilidad nueva y guardar.
  await page.getByRole('button', { name: 'Editar perfil' }).click();
  await page.getByPlaceholder('Ej: React, TypeScript...').fill('GraphQL');     // input de Habilidades (único)
  await page.getByRole('button', { name: '+ Añadir' }).first().click();         // primer ChipInput = Habilidades
  await page.getByRole('button', { name: 'Guardar cambios' }).click();

  // El PUT regenera embeddings (lento); la habilidad nueva debe quedar visible en el perfil.
  await expect(page.getByText('GraphQL').first()).toBeVisible({ timeout: 30_000 });
});
