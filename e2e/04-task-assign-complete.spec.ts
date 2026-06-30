import { test, expect } from '@playwright/test';
import { seedTeamWithMembers, loginViaUI } from './helpers';

test('Líder: crear tarea → asignar (candidatos reales) → completar', async ({ page, request }) => {
  // Seed: equipo + 2 miembros con perfil (para que la recomendación devuelva candidatos).
  const seed = await seedTeamWithMembers(request, [
    { name: 'Ana Backend', abilities: 'Java, Spring Boot, JPA, REST APIs, PostgreSQL', interests: 'Backend, APIs, bases de datos' },
    { name: 'Beto Frontend', abilities: 'React, TypeScript, CSS, UI', interests: 'Frontend, diseño' },
  ]);

  await loginViaUI(page, seed.email);
  await expect(page.getByRole('button', { name: 'Categorías' })).toBeVisible({ timeout: 30_000 });

  // 1) Crear categoría.
  const categoryName = `Plataforma ${Date.now()}`;
  await page.getByRole('button', { name: 'Categorías' }).click();
  await page.getByRole('button', { name: '+ Nueva' }).first().click();
  await page.getByPlaceholder('Ej: Diseño UI').fill(categoryName);
  await page.locator('input[type="date"]').fill('2026-12-31');
  await page.getByRole('button', { name: 'Crear Categoría' }).click();
  await expect(page.getByText(categoryName).first()).toBeVisible({ timeout: 30_000 });

  // 2) Crear tarea backend en esa categoría.
  const taskTitle = `API de facturación ${Date.now()}`;
  await page.getByRole('button', { name: 'Gestión de Tareas' }).click();
  await page.getByRole('button', { name: /Agregar Tarea/ }).click();
  const dialog = page.locator('.fixed.inset-0').filter({ hasText: 'Nueva Tarea' });
  await dialog.getByPlaceholder('Ej: Implementar módulo de pagos').fill(taskTitle);
  await dialog.getByPlaceholder('Describe en detalle la tarea a realizar...')
    .fill('Spring Boot REST endpoints con JPA y PostgreSQL para el módulo de facturación backend');
  await dialog.locator('select').first().selectOption(categoryName);    // primer select = Categoría
  await dialog.getByPlaceholder('Ej: 8').fill('8');
  await dialog.locator('input[type="date"]').fill('2026-12-20');
  await dialog.getByPlaceholder('Ej: React, TypeScript, Figma').fill('Spring Boot, JPA');
  await dialog.getByPlaceholder('Ej: REST APIs, autenticación JWT').fill('REST, PostgreSQL');
  await dialog.getByRole('button', { name: /^Crear Tarea$/ }).click();

  // La tarea aparece en la tabla, sin asignar (botón "Asignar").
  const row = page.locator('tr', { hasText: taskTitle });
  await expect(row).toBeVisible({ timeout: 30_000 });

  // 3) Asignar: abre el modal con candidatos REALES (GET /recommend).
  await row.getByRole('button', { name: 'Asignar' }).click();
  const assignDialog = page.locator('.fixed.inset-0').filter({ hasText: 'Asignar tarea' });
  await expect(assignDialog.getByText('Buscando candidatos...')).toBeHidden({ timeout: 40_000 });
  // El backend (tarea backend) debe recomendar a Ana Backend.
  await assignDialog.getByRole('button', { name: /Ana Backend/ }).click();
  await assignDialog.getByRole('button', { name: /Confirmar asignación/ }).click();

  // 4) La tarea queda asignada y "En progreso".
  await expect(row.getByText('Ana Backend')).toBeVisible({ timeout: 30_000 });
  await expect(row.getByText('En progreso')).toBeVisible();

  // 5) Completar: el drawer de detalle ya quedó abierto tras asignar; marcar "Completada"
  //    (dispara updateTask DONE → el backend completa la asignación y libera horas).
  const completeBtn = page.getByRole('button', { name: 'Completada' });
  await expect(completeBtn).toBeVisible({ timeout: 15_000 });
  await completeBtn.click();
  await expect(row.getByText('Completada')).toBeVisible({ timeout: 30_000 });
});
