import { test, expect } from '@playwright/test';

// BUG documentado: con credenciales incorrectas el backend responde 401 con CUERPO VACÍO y authService.signIn
// hace response.json() ANTES de chequear response.ok → la UI muestra "Failed to execute 'json' on 'Response':
// Unexpected end of JSON input" en vez de un mensaje amigable. Este test espera el comportamiento correcto,
// por lo que FALLA hasta que se arregle (backend: devolver JSON en el 401 / front: chequear ok antes de json()).
test('Borde: login con contraseña incorrecta NO debe mostrar un error técnico de JSON', async ({ page }) => {
  await page.goto('/');
  await page.locator('input[type="email"]').fill(`noexiste_${Date.now()}@e2e.test`);
  await page.locator('input[type="password"]').fill('ClaveIncorrecta1!');

  // Esperar a que el sign-in resuelva (evita el race con el cold-start).
  const [resp] = await Promise.all([
    page.waitForResponse(r => r.url().includes('/authentication/sign-in'), { timeout: 30_000 }),
    page.getByRole('button', { name: /^Iniciar sesión$/ }).click(),
  ]);
  expect(resp.status()).toBe(401);
  await page.waitForTimeout(800); // dar tiempo a renderizar el mensaje

  await expect(page.getByText(/Failed to execute 'json'|Unexpected end of JSON/i)).toHaveCount(0);
});
