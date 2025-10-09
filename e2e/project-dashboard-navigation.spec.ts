/**
 * E2E Test: Project Dashboard Navigation
 *
 * Reproduces the bug: clicking a project from Projects List should navigate
 * to the Project Dashboard, but currently shows an Alert instead.
 *
 * Expected behavior:
 * 1. User creates a project (or loads existing)
 * 2. User clicks project card in Projects List
 * 3. App navigates to Project Dashboard showing project details
 * 4. Dashboard displays project name, niche, videos, scripts, and actions
 *
 * Actual behavior (before fix):
 * - Shows Alert: "Project dashboard coming soon!"
 * - No navigation occurs
 *
 * @see src/screens/ProjectsListScreen.tsx:115-121 (bug location)
 */

import { test, expect } from '@playwright/test';

test.describe('Project Dashboard Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to app
    await page.goto('http://localhost:8081');

    // Skip onboarding if needed
    const onboardingButton = page.getByRole('button', { name: /get started|continue/i });
    if (await onboardingButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await onboardingButton.click();
    }

    // Ensure we're on Projects List
    await expect(page.getByText(/projects/i)).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to project dashboard when clicking a project card', async ({ page }) => {
    // Step 1: Create a test project if none exist
    const createButton = page.getByRole('button', { name: /create project/i });
    const hasProjects = await page.locator('[data-testid="project-card"]').count() > 0;

    if (!hasProjects) {
      await createButton.click();

      // Fill in project name (assuming there's a prompt or form)
      const projectNameInput = page.getByPlaceholder(/project name/i);
      await projectNameInput.fill('Test Project Alpha');
      await page.getByRole('button', { name: /create|save/i }).click();

      // Wait for project to appear in list
      await expect(page.getByText('Test Project Alpha')).toBeVisible();
    }

    // Step 2: Get first project card
    const projectCard = page.locator('[data-testid="project-card"]').first();
    const projectName = await projectCard.locator('[data-testid="project-name"]').textContent();

    // Step 3: Click the project card
    await projectCard.click();

    // Step 4: Verify navigation to Project Dashboard
    // Should see "Dashboard" heading
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible({ timeout: 5000 });

    // Should see Quick Actions section
    await expect(page.getByText(/quick actions/i)).toBeVisible();

    // Should see action cards
    await expect(page.getByRole('button', { name: /new project/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /generate script/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /record video/i })).toBeVisible();

    // Should see "All Projects" section with the clicked project
    await expect(page.getByText(/all projects/i)).toBeVisible();
    await expect(page.getByText(projectName!)).toBeVisible();

    // URL should reflect the navigation (if using URL-based routing)
    // await expect(page).toHaveURL(/\/projects\/[a-z0-9_-]+/i);
  });

  test('should NOT show alert dialog when clicking project', async ({ page }) => {
    // Setup: ensure at least one project exists
    const projectCard = page.locator('[data-testid="project-card"]').first();

    // Listen for alert dialogs
    let alertShown = false;
    page.on('dialog', async dialog => {
      alertShown = true;
      await dialog.dismiss();
    });

    // Click project
    await projectCard.click();

    // Wait a moment for potential dialog
    await page.waitForTimeout(1000);

    // Verify NO alert was shown
    expect(alertShown).toBe(false);
  });

  test('should display correct project data in dashboard', async ({ page }) => {
    // Create project with specific data
    const testProject = {
      name: 'Video Marketing Campaign',
      niche: 'Digital Marketing',
      subNiche: 'Social Media'
    };

    // Navigate to create project (implementation depends on UI)
    // ... project creation steps ...

    // Click the created project
    const projectCard = page.getByText(testProject.name);
    await projectCard.click();

    // Verify dashboard shows correct project info
    await expect(page.getByText(testProject.name)).toBeVisible();
    await expect(page.getByText(new RegExp(testProject.niche, 'i'))).toBeVisible();
    await expect(page.getByText(new RegExp(testProject.subNiche, 'i'))).toBeVisible();
  });

  test('should handle navigation back from dashboard', async ({ page }) => {
    // Click a project to go to dashboard
    const projectCard = page.locator('[data-testid="project-card"]').first();
    await projectCard.click();

    // Wait for dashboard to load
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();

    // Navigate back (using browser back button or back navigation)
    await page.goBack();

    // Should be back on Projects List
    await expect(page.getByText(/projects/i)).toBeVisible();
    await expect(projectCard).toBeVisible();
  });

  test('dashboard should be accessible via keyboard navigation', async ({ page }) => {
    const projectCard = page.locator('[data-testid="project-card"]').first();

    // Focus the project card
    await projectCard.focus();

    // Press Enter to activate
    await page.keyboard.press('Enter');

    // Should navigate to dashboard
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
  });

  test('dashboard should load within performance budget', async ({ page }) => {
    const startTime = Date.now();

    // Click project
    const projectCard = page.locator('[data-testid="project-card"]').first();
    await projectCard.click();

    // Wait for dashboard to fully load
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
    await expect(page.getByText(/quick actions/i)).toBeVisible();

    const loadTime = Date.now() - startTime;

    // p95 budget: < 1200ms
    expect(loadTime).toBeLessThan(1200);
  });
});
