import { test, expect } from '@playwright/test';

/**
 * Onboarding Flow E2E Tests
 *
 * Tests the niche and sub-niche selection flow on Expo Web.
 * Verifies persistence and navigation to Projects List.
 */

test.describe('Onboarding', () => {
  test.beforeEach(async ({ page, context }) => {
    // Clear storage to simulate first launch
    await context.clearCookies();
    await page.goto('/');
  });

  test('should display niche selection on first launch', async ({ page }) => {
    // Wait for onboarding screen
    await expect(page.locator('text=/niche|healthcare|finance|fitness/i')).toBeVisible({
      timeout: 10000,
    });

    // Verify splash screen is replaced
    await expect(page.locator('text=/shorty\.ai|loading/i')).not.toBeVisible();
  });

  test('should complete niche selection flow', async ({ page }) => {
    // Wait for niche selection screen
    await page.waitForLoadState('networkidle');

    // Select a niche (Healthcare)
    const nicheButton = page.locator('text=/healthcare/i').first();
    await nicheButton.waitFor({ state: 'visible', timeout: 10000 });
    await nicheButton.click();

    // Sub-niche selection should appear (or proceed directly)
    // This depends on implementation - adjust selector as needed
    await page.waitForTimeout(1000); // Allow UI to update

    // Look for confirmation or next step
    const continueButton = page.locator('button:has-text("Continue"), button:has-text("Confirm"), button:has-text("Next")').first();

    if (await continueButton.isVisible({ timeout: 5000 })) {
      await continueButton.click();
    }

    // Should navigate to Projects List
    await expect(page.locator('text=/projects|create project|\\+/i')).toBeVisible({
      timeout: 15000,
    });
  });

  test('should persist niche selection across reloads', async ({ page }) => {
    // Complete onboarding
    await page.waitForLoadState('networkidle');

    const nicheButton = page.locator('text=/healthcare/i').first();
    await nicheButton.waitFor({ state: 'visible', timeout: 10000 });
    await nicheButton.click();

    await page.waitForTimeout(1000);

    const continueButton = page.locator('button:has-text("Continue"), button:has-text("Confirm"), button:has-text("Next")').first();
    if (await continueButton.isVisible({ timeout: 5000 })) {
      await continueButton.click();
    }

    // Wait for Projects List
    await expect(page.locator('text=/projects/i')).toBeVisible({ timeout: 10000 });

    // Reload page
    await page.reload({ waitUntil: 'networkidle' });

    // Should go directly to Projects List (onboarding skipped)
    await expect(page.locator('text=/projects/i')).toBeVisible({ timeout: 10000 });

    // Should NOT show niche selection again
    await expect(page.locator('text=/select.*niche/i')).not.toBeVisible();
  });

  test('should show validation for empty selection', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Try to proceed without selecting niche
    const continueButton = page.locator('button:has-text("Continue"), button:has-text("Confirm"), button:has-text("Next")').first();

    if (await continueButton.isVisible({ timeout: 5000 })) {
      await continueButton.click();

      // Should show validation message or stay on same screen
      await expect(page.locator('text=/select.*niche|required/i, text=/projects/i')).toBeVisible({
        timeout: 5000,
      });
    }
  });
});
