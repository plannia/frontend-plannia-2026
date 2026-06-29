import { test, expect } from '@playwright/test';
import { createTeamViaApi, apiLogin, loginViaUI, uniqueEmail, PASSWORD, API } from './helpers';

test('Líder: editar el cargo de un miembro lo persiste', async ({ page, request }) => {
  const lead = await createTeamViaApi(request);
  const memberEmail = uniqueEmail('mem');
  const memberName = 'Eddy Editable';
  await request.post(`${API}/authentication/sign-up`, {
    data: { name: memberName, email: memberEmail, password: PASSWORD, position: 'Junior Dev', code: lead.code },
  });
  const si = await request.post(`${API}/authentication/sign-in`, { data: { email: memberEmail, password: PASSWORD } });
  const memberId = (await si.json()).user.id as number;
  const { token } = await apiLogin(request, lead.email);

  await loginViaUI(page, lead.email);
  await page.locator('nav').getByRole('button', { name: 'Equipo' }).click();
  await expect(page.getByText(memberName)).toBeVisible({ timeout: 30_000 });

  // Abrir "Editar" en la card del miembro (no la del líder).
  await page.getByRole('heading', { name: memberName })
    .locator('xpath=ancestor::div[.//button[normalize-space()="Editar"]][1]')
    .getByRole('button', { name: 'Editar' })
    .click();

  const modal = page.locator('.fixed.inset-0').filter({ hasText: 'Editar miembro' });
  await expect(modal).toBeVisible({ timeout: 15_000 });

  // Cambiar el Cargo (3er campo; 2do input sin type, tras Nombre). Email/password se dejan igual.
  const newPosition = 'Senior Engineer';
  await modal.locator('input:not([type])').nth(1).fill(newPosition);
  await modal.getByRole('button', { name: 'Guardar cambios' }).click();

  // updateUser (PUT /users/{id}) persistió el nuevo cargo.
  await expect.poll(async () => {
    const res = await request.get(`${API}/users/${memberId}`, { headers: { Authorization: `Bearer ${token}` } });
    return (await res.json()).position as string;
  }, { timeout: 20_000 }).toBe(newPosition);
});
