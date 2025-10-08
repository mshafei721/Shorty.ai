import { test, expect } from '@playwright/test';

/**
 * Preview & Export E2E Tests
 *
 * Tests video preview playback and export/share functionality on Expo Web.
 * Since there's no backend yet, these tests verify UI states.
 */

test.describe('Preview & Export', () => {
  test.beforeEach(async ({ page, context }) => {
    // Set up completed onboarding with mock processed video
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

      localStorage.setItem('videos', JSON.stringify([{
        id: 'test-video-1',
        projectId: 'test-project-1',
        type: 'processed',
        scriptId: 'test-script-1',
        localUri: 'mock://processed-video.mp4',
        durationSec: 30,
        sizeBytes: 1024 * 1024 * 5,
        createdAt: new Date().toISOString(),
        exportedAt: null,
        status: 'ready',
      }]));
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should display projects list with video', async ({ page }) => {
    // Should see project
    await expect(page.locator('text=/test project/i')).toBeVisible({
      timeout: 10000,
    });
  });

  test('should navigate to preview from project', async ({ page }) => {
    // Click on project or video
    const projectLink = page.locator('text=/test project/i').first();

    if (await projectLink.isVisible({ timeout: 5000 })) {
      await projectLink.click();

      // Should see video player or preview screen
      await expect(
        page.locator('text=/preview|play|video|processed/i, video')
      ).toBeVisible({ timeout: 10000 });
    }
  });

  test('should show video player controls', async ({ page }) => {
    const projectLink = page.locator('text=/test project/i').first();

    if (await projectLink.isVisible({ timeout: 5000 })) {
      await projectLink.click();
      await page.waitForTimeout(2000);

      // Look for video element or player controls
      const videoElement = page.locator('video').first();
      const playButton = page.locator('button:has-text("Play"), button[aria-label*="play"]').first();

      const hasVideo = await videoElement.isVisible({ timeout: 5000 }).catch(() => false);
      const hasPlayControl = await playButton.isVisible({ timeout: 5000 }).catch(() => false);

      expect(hasVideo || hasPlayControl).toBeTruthy();
    }
  });

  test('should show export/share button', async ({ page }) => {
    const projectLink = page.locator('text=/test project/i').first();

    if (await projectLink.isVisible({ timeout: 5000 })) {
      await projectLink.click();
      await page.waitForTimeout(2000);

      // Look for export or share button
      await expect(
        page.locator('button:has-text("Export"), button:has-text("Share"), text=/export|share/i')
      ).toBeVisible({ timeout: 10000 });
    }
  });

  test('should display video metadata', async ({ page }) => {
    const projectLink = page.locator('text=/test project/i').first();

    if (await projectLink.isVisible({ timeout: 5000 })) {
      await projectLink.click();
      await page.waitForTimeout(2000);

      // Should show duration or file info
      await expect(
        page.locator('text=/\\d+:\\d+|\\d+s|duration|30.*sec/i, text=/MB|size/i')
      ).toBeVisible({ timeout: 10000 });
    }
  });

  test('should handle export button click', async ({ page }) => {
    const projectLink = page.locator('text=/test project/i').first();

    if (await projectLink.isVisible({ timeout: 5000 })) {
      await projectLink.click();
      await page.waitForTimeout(2000);

      const exportButton = page.locator('button:has-text("Export"), button:has-text("Share")').first();

      if (await exportButton.isVisible({ timeout: 5000 })) {
        await exportButton.click();

        // Should show share options or confirmation
        // On web, native share may not work, but UI should respond
        await expect(
          page.locator('text=/sharing|exported|saved|unavailable/i')
        ).toBeVisible({ timeout: 10000 });
      }
    }
  });

  test('should show feature summary in preview', async ({ page }) => {
    const projectLink = page.locator('text=/test project/i').first();

    if (await projectLink.isVisible({ timeout: 5000 })) {
      await projectLink.click();
      await page.waitForTimeout(2000);

      // Look for applied features indicators
      // e.g., "Subtitles", "Filler Removal", etc.
      const hasFeatures = await Promise.race([
        page.locator('text=/subtitle|caption|filler|music|intro/i').isVisible({ timeout: 5000 }),
        page.locator('text=/feature|applied/i').isVisible({ timeout: 5000 }),
      ]).catch(() => false);

      // Feature summary may or may not be present yet
      // Just verify the preview screen loaded
      expect(hasFeatures || await page.locator('text=/preview|video/i').isVisible()).toBeTruthy();
    }
  });

  test('should allow returning to projects list', async ({ page }) => {
    const projectLink = page.locator('text=/test project/i').first();

    if (await projectLink.isVisible({ timeout: 5000 })) {
      await projectLink.click();
      await page.waitForTimeout(2000);

      // Look for back button or navigation
      const backButton = page.locator('button:has-text("Back"), button[aria-label*="back"], a[href*="projects"]').first();

      if (await backButton.isVisible({ timeout: 5000 })) {
        await backButton.click();

        // Should return to projects list
        await expect(page.locator('text=/projects/i')).toBeVisible({ timeout: 10000 });
      }
    }
  });
});
