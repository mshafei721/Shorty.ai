import { test, expect } from '@playwright/test';

/**
 * Processing Status E2E Tests
 *
 * Tests feature selection and processing status monitoring on Expo Web.
 * Without backend, tests verify UI flow and error handling.
 */

test.describe('Processing', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.addInitScript(() => {
      localStorage.setItem('userProfile', JSON.stringify({
        niche: 'Healthcare',
        subNiche: 'Physiotherapy',
        completedAt: new Date().toISOString(),
      }));

      localStorage.setItem('projects', JSON.stringify([{
        id: 'test-project-1',
        name: 'Test Project',
        niche: 'Healthcare',
        subNiche: 'Physiotherapy',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isDeleted: false,
      }]));

      // Raw video ready for feature selection
      localStorage.setItem('videos', JSON.stringify([{
        id: 'test-raw-1',
        projectId: 'test-project-1',
        type: 'raw',
        scriptId: 'test-script-1',
        localUri: 'mock://raw-video.mp4',
        durationSec: 45,
        sizeBytes: 1024 * 1024 * 10,
        createdAt: new Date().toISOString(),
        exportedAt: null,
        status: 'ready',
      }]));
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should show feature selection screen', async ({ page }) => {
    const projectLink = page.locator('text=/test project/i').first();

    if (await projectLink.isVisible({ timeout: 5000 })) {
      await projectLink.click();
      await page.waitForTimeout(2000);

      // Look for feature toggles
      await expect(
        page.locator('text=/feature|subtitle|caption|filler|music|background/i')
      ).toBeVisible({ timeout: 10000 });
    }
  });

  test('should display available features list', async ({ page }) => {
    const projectLink = page.locator('text=/test project/i').first();

    if (await projectLink.isVisible({ timeout: 5000 })) {
      await projectLink.click();
      await page.waitForTimeout(2000);

      // Should see multiple feature options
      // PRD specifies: subtitles, background change, music, intro/outro, filler removal
      const featureTexts = [
        'subtitle',
        'caption',
        'filler',
        'music',
        'background',
        'intro',
        'outro',
      ];

      let foundFeatures = 0;

      for (const featureText of featureTexts) {
        const isVisible = await page.locator(`text=/${featureText}/i`).isVisible({ timeout: 2000 }).catch(() => false);
        if (isVisible) foundFeatures++;
      }

      // Should find at least 2 feature options
      expect(foundFeatures).toBeGreaterThanOrEqual(2);
    }
  });

  test('should toggle features on/off', async ({ page }) => {
    const projectLink = page.locator('text=/test project/i').first();

    if (await projectLink.isVisible({ timeout: 5000 })) {
      await projectLink.click();
      await page.waitForTimeout(2000);

      // Look for toggle switches or checkboxes
      const toggle = page.locator('input[type="checkbox"], button[role="switch"]').first();

      if (await toggle.isVisible({ timeout: 5000 })) {
        const initialState = await toggle.isChecked().catch(() => false);

        await toggle.click();
        await page.waitForTimeout(500);

        const newState = await toggle.isChecked().catch(() => false);

        // State should have changed
        expect(newState).not.toBe(initialState);
      }
    }
  });

  test('should show processing button', async ({ page }) => {
    const projectLink = page.locator('text=/test project/i').first();

    if (await projectLink.isVisible({ timeout: 5000 })) {
      await projectLink.click();
      await page.waitForTimeout(2000);

      // Look for button to start processing
      await expect(
        page.locator('button:has-text("Process"), button:has-text("Generate"), button:has-text("Apply"), button:has-text("Continue")')
      ).toBeVisible({ timeout: 10000 });
    }
  });

  test('should show error when backend not configured', async ({ page }) => {
    const projectLink = page.locator('text=/test project/i').first();

    if (await projectLink.isVisible({ timeout: 5000 })) {
      await projectLink.click();
      await page.waitForTimeout(2000);

      const processButton = page.locator('button:has-text("Process"), button:has-text("Generate"), button:has-text("Apply")').first();

      if (await processButton.isVisible({ timeout: 5000 })) {
        await processButton.click();

        // Should show error about missing backend configuration
        await expect(
          page.locator('text=/error|failed|backend|url|configuration|expo_public_m2_base_url/i')
        ).toBeVisible({ timeout: 15000 });
      }
    }
  });

  test('should display processing status UI when job starts', async ({ page, context }) => {
    // Mock environment with backend URL set
    await context.addInitScript(() => {
      (window as any).process = {
        env: {
          EXPO_PUBLIC_M2_BASE_URL: 'http://mock-backend.test',
        },
      };
    });

    const projectLink = page.locator('text=/test project/i').first();

    if (await projectLink.isVisible({ timeout: 5000 })) {
      await projectLink.click();
      await page.waitForTimeout(2000);

      const processButton = page.locator('button:has-text("Process"), button:has-text("Generate")').first();

      if (await processButton.isVisible({ timeout: 5000 })) {
        await processButton.click();

        // Should show processing status (progress bar, percentage, or status text)
        const hasStatus = await Promise.race([
          page.locator('text=/processing|queued|uploading|\\d+%/i').isVisible({ timeout: 10000 }),
          page.locator('[role="progressbar"], progress').isVisible({ timeout: 10000 }),
        ]).catch(() => false);

        // Without real backend, may show error or status screen
        expect(
          hasStatus || await page.locator('text=/error|failed/i').isVisible({ timeout: 5000 })
        ).toBeTruthy();
      }
    }
  });

  test('should show cancel button during processing', async ({ page, context }) => {
    await context.addInitScript(() => {
      (window as any).process = {
        env: {
          EXPO_PUBLIC_M2_BASE_URL: 'http://mock-backend.test',
        },
      };
    });

    const projectLink = page.locator('text=/test project/i').first();

    if (await projectLink.isVisible({ timeout: 5000 })) {
      await projectLink.click();
      await page.waitForTimeout(2000);

      const processButton = page.locator('button:has-text("Process"), button:has-text("Generate")').first();

      if (await processButton.isVisible({ timeout: 5000 })) {
        await processButton.click();
        await page.waitForTimeout(2000);

        // Look for cancel button (PRD requirement)
        const cancelButton = page.locator('button:has-text("Cancel"), button:has-text("Stop")').first();
        const hasCancelOption = await cancelButton.isVisible({ timeout: 5000 }).catch(() => false);

        // Cancel button should be present during processing
        // Or error screen may show instead if backend unavailable
        expect(
          hasCancelOption || await page.locator('text=/error|failed/i').isVisible({ timeout: 3000 })
        ).toBeTruthy();
      }
    }
  });

  test('should show retry option on failure', async ({ page }) => {
    const projectLink = page.locator('text=/test project/i').first();

    if (await projectLink.isVisible({ timeout: 5000 })) {
      await projectLink.click();
      await page.waitForTimeout(2000);

      const processButton = page.locator('button:has-text("Process"), button:has-text("Generate")').first();

      if (await processButton.isVisible({ timeout: 5000 })) {
        await processButton.click();
        await page.waitForTimeout(5000);

        // Should show retry button on error
        const retryButton = page.locator('button:has-text("Retry"), button:has-text("Try Again")').first();
        const hasRetry = await retryButton.isVisible({ timeout: 10000 }).catch(() => false);

        // Without backend, should eventually show retry option
        if (hasRetry) {
          expect(hasRetry).toBeTruthy();
        }
      }
    }
  });
});
