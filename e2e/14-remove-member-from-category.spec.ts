import { test, expect } from '@playwright/test';
import { createTeamViaApi, apiLogin, createCategoryApi, loginViaUI, uniqueEmail, PASSWORD, API } from './helpers';

test('Líder: quitar un miembro de una categoría lo saca de la categoría', async ({ page, request }) => {
  // Seed por API: equipo + miembro (con perfil) + categoría con ese miembro adentro.
  const lead = await createTeamViaApi(request);
  const memberEmail = uniqueEmail('mem');
  const memberName = 'Quito Borrable';
  await request.post(`${API}/authentication/sign-up`, {
    data: { name: memberName, email: memberEmail, password: PASSWORD, position: 'Dev', code: lead.code },
  });
  const si = await request.post(`${API}/authentication/sign-in`, { data: { email: memberEmail, password: PASSWORD } });
  const member = await si.json();
  const memberId = member.user.id as number;
  await request.put(`${API}/member-profiles/users/${memberId}`, {
    headers: { Authorization: `Bearer ${member.token}` },
    data: { maxHours: 40, abilities: 'Java, Spring', interests: 'Backend' },
  });
  const { token } = await apiLogin(request, lead.email);
  const catId = await createCategoryApi(request, token, lead.teamId, `CatRemove ${Date.now()}`);
  await request.post(`${API}/categories/${catId}/members`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { userId: memberId },
  });

  await loginViaUI(page, lead.email);
  await page.getByRole('button', { name: 'Categorías' }).click();

  // La categoría (única) queda seleccionada → Editar → sacar al miembro → guardar.
  await page.getByRole('button', { name: 'Editar' }).click();
  await expect(page.getByText('Editar Categoría')).toBeVisible({ timeout: 15_000 });
  await page.getByRole('button', { name: /Quito/ }).click();          // toggle OFF en el multiselect
  await page.getByRole('button', { name: 'Guardar cambios' }).click();

  // DELETE /categories/{id}/members/{userId} → el miembro ya no está en la categoría.
  await expect.poll(async () => {
    const res = await request.get(`${API}/categories/teams/${lead.teamId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const cats = await res.json();
    const cat = cats.find((c: any) => c.id === catId);
    return (cat?.memberIds ?? []) as number[];
  }, { timeout: 20_000 }).not.toContain(memberId);
});
