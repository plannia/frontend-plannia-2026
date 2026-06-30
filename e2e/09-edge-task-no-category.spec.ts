import { test, expect } from '@playwright/test';
import { createTeamViaUI } from './helpers';

test('Borde: intentar crear tarea sin categorías muestra el guard (no abre el modal)', async ({ page }) => {
  // Equipo nuevo, sin categorías.
  await createTeamViaUI(page);
  await page.getByRole('button', { name: /Ir al Dashboard del Líder/ }).click();
  await page.getByRole('button', { name: 'Gestión de Tareas' }).click();

  await page.getByRole('button', { name: /Agregar Tarea/ }).click();

  // No debe abrirse el modal "Nueva Tarea"; debe avisar que primero hay que crear categoría.
  await expect(page.getByText('Nueva Tarea')).toHaveCount(0);
  await expect(page.getByText(/Primero crea una categoría/i)).toBeVisible({ timeout: 10_000 });
});
