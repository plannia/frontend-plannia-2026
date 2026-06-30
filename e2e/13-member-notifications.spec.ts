import { test, expect } from '@playwright/test';
import { seedMemberWithAssignedTask, loginViaUI } from './helpers';

// Antes la UI de Notificaciones mostraba datos MOCK; ahora consume el notificationService real
// (getUiNotificationsByUser) en MemberAppLayout/AppLayout/ProfileNotifications. Este test verifica
// que la notificación REAL de asignación aparece en la página de Notificaciones del miembro.
test('Miembro: ve en "Notificaciones" el aviso de la tarea que se le asignó', async ({ page, request }) => {
  const seed = await seedMemberWithAssignedTask(request, { memberName: 'Nico Miembro' });

  await loginViaUI(page, seed.memberEmail);
  await page.locator('nav').getByRole('button', { name: /Notificaciones/ }).click();

  // El mensaje de la notificación de asignación debe aparecer.
  await expect(page.getByText(/se te asignó la tarea/i).first()).toBeVisible({ timeout: 30_000 });
});
