import { defineConfig, devices } from '@playwright/test';

// E2E del frontend. Corre contra el dev server de Vite (refleja el código fuente en vivo)
// y el backend REAL de Azure (ver e2e/helpers.ts).
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 90_000,
  expect: { timeout: 20_000 },
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:5173',
    headless: false,                 // ventana visible (cambiá a true para CI)
    launchOptions: { slowMo: 400 },
    viewport: { width: 1366, height: 850 },
    video: 'on',
    screenshot: 'only-on-failure',
    trace: 'on',
    actionTimeout: 20_000,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
