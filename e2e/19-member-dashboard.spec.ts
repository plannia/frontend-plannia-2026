import { test, expect } from '@playwright/test';
import { seedMemberWithAssignedTask, loginViaUI } from './helpers';

test('Miembro: su Dashboard muestra el saludo y su tarea asignada', async ({ page, request }) => {
  const seed = await seedMemberWithAssignedTask(request, { memberName: 'Debi Dashboard' });

  await loginViaUI(page, seed.memberEmail); // MemberDashboard es la vista por defecto del miembro

  await expect(page.getByRole('heading', { name: /Hola, Debi Dashboard/ })).toBeVisible({ timeout: 30_000 });
  // Su tarea asignada aparece en "Mis tareas recientes".
  await expect(page.getByText(seed.taskTitle)).toBeVisible({ timeout: 20_000 });
});
