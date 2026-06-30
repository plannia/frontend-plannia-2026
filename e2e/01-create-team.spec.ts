import { test, expect } from '@playwright/test';
import { createTeamViaUI } from './helpers';

test('Líder: crear equipo desde la UI muestra el código y entra al dashboard', async ({ page }) => {
  const { code } = await createTeamViaUI(page);

  // El backend genera el código con los 3 primeros chars del nombre + dígitos (ej. "E2E851005").
  expect(code).toMatch(/^[A-Z0-9]{3}\d{5,6}$/);

  // Entrar al dashboard del líder.
  await page.getByRole('button', { name: /Ir al Dashboard del Líder/ }).click();

  // Ya no estamos en la pantalla de creación: el modal/título de login desapareció.
  await expect(page.getByText('¡Equipo creado con éxito!')).toBeHidden();
  await expect(page.getByRole('button', { name: /Crea tu equipo aquí/ })).toHaveCount(0);
});
