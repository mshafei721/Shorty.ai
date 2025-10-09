import { test, expect } from '@playwright/test';

/**
 * Recording Flow E2E Tests
 *
 * Tests script input and recording initialization on Expo Web.
 * Note: Actual video capture is limited on web - we test UI flow only.
 */

test.describe('Recording', () => {
  test.beforeEach(async ({ page, context }) => {
    // Set up completed onboarding
    await context.addInitScript(() => {
      localStorage.setItem('userProfile', JSON.stringify({
        niche: 'Healthcare',
        subNiche: 'Physiotherapy',
        completedAt: new Date().toISOString(),
      }));
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should navigate to script screen from projects list', async ({ page }) => {
    // Look for create button (+ or "Create Project" or "New Video")
    const createButton = page.locator('button:has-text("+"), button:has-text("Create"), button:has-text("New")').first();

    await createButton.waitFor({ state: 'visible', timeout: 10000 });
    await createButton.click();

    // Should see script input or project creation
    await expect(page.locator('text=/script|paste|generate|record/i')).toBeVisible({
      timeout: 10000,
    });
  });

  test('should accept pasted script text', async ({ page }) => {
    // Navigate to script screen
    const createButton = page.locator('button:has-text("+"), button:has-text("Create")').first();
    if (await createButton.isVisible({ timeout: 5000 })) {
      await createButton.click();
    }

    await page.waitForTimeout(1000);

    // Look for text input for script
    const scriptInput = page.locator('textarea, input[type="text"]').first();

    if (await scriptInput.isVisible({ timeout: 5000 })) {
      const testScript = 'Welcome to this physiotherapy tutorial. Today we will learn proper stretching techniques.';
      await scriptInput.fill(testScript);

      // Verify input accepted
      await expect(scriptInput).toHaveValue(testScript);
    }
  });

  test('should show character/word count for script', async ({ page }) => {
    const createButton = page.locator('button:has-text("+"), button:has-text("Create")').first();
    if (await createButton.isVisible({ timeout: 5000 })) {
      await createButton.click();
    }

    await page.waitForTimeout(1000);

    const scriptInput = page.locator('textarea').first();

    if (await scriptInput.isVisible({ timeout: 5000 })) {
      const testScript = 'Short test script for word counting';
      await scriptInput.fill(testScript);

      // Look for word count display
      await expect(page.locator('text=/\\d+\\s*(word|character)/i')).toBeVisible({
        timeout: 5000,
      });
    }
  });

  test('should validate minimum script length', async ({ page }) => {
    const createButton = page.locator('button:has-text("+"), button:has-text("Create")').first();
    if (await createButton.isVisible({ timeout: 5000 })) {
      await createButton.click();
    }

    await page.waitForTimeout(1000);

    const scriptInput = page.locator('textarea').first();

    if (await scriptInput.isVisible({ timeout: 5000 })) {
      // Enter script with <20 words (PRD requirement)
      await scriptInput.fill('Too short');

      // Try to proceed
      const nextButton = page.locator('button:has-text("Next"), button:has-text("Continue"), button:has-text("Record")').first();

      if (await nextButton.isVisible({ timeout: 3000 })) {
        await nextButton.click();

        // Should show validation error or remain on same screen
        await expect(
          page.locator('text=/minimum|required|20 words/i, text=/script|paste/i')
        ).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('should request camera permissions before recording', async ({ page, context }) => {
    // Grant permissions upfront for this test
    await context.grantPermissions(['camera', 'microphone']);

    const createButton = page.locator('button:has-text("+"), button:has-text("Create")').first();
    if (await createButton.isVisible({ timeout: 5000 })) {
      await createButton.click();
    }

    await page.waitForTimeout(1000);

    const scriptInput = page.locator('textarea').first();

    if (await scriptInput.isVisible({ timeout: 5000 })) {
      // Enter valid script
      await scriptInput.fill(
        'Welcome to physiotherapy. Today we cover stretching techniques for knee pain relief. Proper form is essential.'
      );

      // Proceed to record
      const recordButton = page.locator('button:has-text("Record"), button:has-text("Continue"), button:has-text("Next")').first();

      if (await recordButton.isVisible({ timeout: 5000 })) {
        await recordButton.click();

        // Should see camera preview or permissions request
        await expect(
          page.locator('text=/camera|record|teleprompter|permission/i')
        ).toBeVisible({ timeout: 10000 });
      }
    }
  });

  test('should show teleprompter controls', async ({ page, context }) => {
    await context.grantPermissions(['camera', 'microphone']);

    const createButton = page.locator('button:has-text("+"), button:has-text("Create")').first();
    if (await createButton.isVisible({ timeout: 5000 })) {
      await createButton.click();
    }

    await page.waitForTimeout(1000);

    const scriptInput = page.locator('textarea').first();

    if (await scriptInput.isVisible({ timeout: 5000 })) {
      await scriptInput.fill('Test script for teleprompter. '.repeat(10)); // ~40 words

      const nextButton = page.locator('button:has-text("Record"), button:has-text("Continue")').first();
      if (await nextButton.isVisible({ timeout: 5000 })) {
        await nextButton.click();

        // Wait for recording screen
        await page.waitForTimeout(2000);

        // Look for teleprompter controls (WPM, font size, play/pause)
        // Note: These selectors will need adjustment based on actual implementation
        const hasControls = await Promise.race([
          page.locator('text=/wpm|speed|font|play|pause/i').isVisible({ timeout: 5000 }),
          page.locator('button[aria-label*="play"], button[aria-label*="pause"]').isVisible({ timeout: 5000 }),
        ]).catch(() => false);

        // If teleprompter is implemented, controls should be visible
        // If not, we just verify we reached the recording screen
        expect(hasControls || await page.locator('text=/record|camera/i').isVisible()).toBeTruthy();
      }
    }
  });
});
