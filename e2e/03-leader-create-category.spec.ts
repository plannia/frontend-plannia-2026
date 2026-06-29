import { test, expect } from '@playwright/test';
import { createTeamViaUI } from './helpers';

test('Líder: crear una categoría/proyecto dentro de la app y verla en la lista', async ({ page }) => {
  // Onboarding de líder por UI (queda logueado dentro de la app).
  await createTeamViaUI(page);
  await page.getByRole('button', { name: /Ir al Dashboard del Líder/ }).click();

  // Ir a la sección Categorías.
  await page.getByRole('button', { name: 'Categorías' }).click();

  // Abrir el modal "Nueva Categoría" y completarlo.
  const categoryName = `Proyecto E2E ${Date.now()}`;
  await page.getByRole('button', { name: '+ Nueva' }).first().click();
  await expect(page.getByText('Nueva Categoría')).toBeVisible();
  await page.getByPlaceholder('Ej: Diseño UI').fill(categoryName);
  await page.locator('input[type="date"]').fill('2026-12-31');
  await page.getByRole('button', { name: 'Crear Categoría' }).click();

  // La categoría recién creada aparece en la lista (POST /categories OK y render).
  await expect(page.getByText(categoryName).first()).toBeVisible({ timeout: 30_000 });
});
