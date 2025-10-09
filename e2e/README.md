# End-to-End Tests (Playwright)

## Overview

E2E tests for Shorty.ai web interface using Playwright with Chrome DevTools Protocol (CDP) integration.

## Setup

### Install Playwright

```bash
npm install
npx playwright install --with-deps
```

### Install Browsers

```bash
npx playwright install chromium
```

For specific browsers:

```bash
npx playwright install chromium webkit firefox
```

## Running Tests

### All tests

```bash
npm run e2e:web
```

### Interactive UI mode

```bash
npm run e2e:web:ui
```

### Specific test file

```bash
npx playwright test e2e/onboarding.spec.ts
```

### With headed browser (see the tests run)

```bash
npx playwright test --headed
```

### Debug mode

```bash
npx playwright test --debug
```

## Test Structure

### `onboarding.spec.ts`
Tests niche and sub-niche selection flow, persistence, and validation.

### `recording.spec.ts`
Tests script input, validation, and recording initialization (web constraints apply).

### `processing.spec.ts`
Tests feature selection UI, processing status, error handling, and retry logic.

### `preview-export.spec.ts`
Tests video preview playback and export/share functionality.

## Configuration

See `playwright.config.ts` for:
- Viewport sizes (mobile/desktop)
- Timeouts and retries
- Screenshot/video capture
- Web server auto-start

## Chrome DevTools (CDP) Integration

Playwright uses CDP under the hood. To inspect with DevTools:

```bash
PWDEBUG=1 npx playwright test
```

Or use `page.pause()` in tests to open inspector.

## MCP Integration

For MCP-driven automation:

1. Ensure MCP server is configured with Chrome DevTools access
2. Launch Expo web with debugging: `npm run web:debug`
3. Connect MCP client to CDP endpoint (usually ws://localhost:9222)

## Viewing Reports

After test run:

```bash
npx playwright show-report
```

HTML report opens in browser with:
- Test results
- Screenshots on failure
- Video recordings
- Trace viewer

## Trace Viewer

View detailed traces:

```bash
npx playwright show-trace playwright-report/trace.zip
```

## Best Practices

1. **Wait for app signals** (not arbitrary sleeps)
   - ✅ `await page.locator('text=Projects').waitFor()`
   - ❌ `await page.waitForTimeout(5000)`

2. **Use semantic selectors**
   - ✅ `page.locator('button:has-text("Export")')`
   - ❌ `page.locator('.btn-export-123')`

3. **Handle missing elements gracefully**
   ```typescript
   if (await button.isVisible({ timeout: 5000 })) {
     await button.click();
   }
   ```

4. **Test real user flows** (not isolated components)

5. **Keep tests independent** (no shared state between tests)

## Troubleshooting

### Tests timeout

Increase timeout in `playwright.config.ts` or specific test:

```typescript
test('slow test', async ({ page }) => {
  test.setTimeout(120000); // 2 minutes
  // ...
});
```

### Web server fails to start

Ensure port 8081 is free:

```bash
npx kill-port 8081
npm run web:dev
```

### Tests pass locally but fail in CI

Check:
- CI has sufficient timeout (120s for webServer)
- Viewport size matches (mobile vs desktop)
- Network conditions (CI may be slower)

### Flaky tests

Add retry in config:

```typescript
retries: process.env.CI ? 2 : 1,
```

Or use `test.retry()` for specific tests.

## CI Integration

See `.github/workflows/ci.yml` for CI configuration. E2E tests run on PR and push to main.

Artifacts (screenshots, videos, traces) are uploaded for failed tests.

## Known Limitations

1. **No backend**: Tests verify UI flow only. Backend implementation pending (Phase 2.1).

2. **Camera/mic access**: Web tests use mocked permissions. Real device capture not tested.

3. **Native features**: iOS/Android-specific features (media library, deep links) not covered.

4. **Video processing**: Actual transcription, composition, encoding not tested without backend.

## Next Steps

- [ ] Add backend stubs for E2E testing
- [ ] Add visual regression testing
- [ ] Add accessibility (a11y) tests
- [ ] Add performance benchmarks
- [ ] Integrate with CI pipeline for nightly runs
