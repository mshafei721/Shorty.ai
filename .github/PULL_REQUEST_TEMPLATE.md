# Pull Request

## Summary
<!-- Brief description of what this PR does (1-3 sentences) -->

## Scope
<!-- What areas of the codebase are affected? -->
- [ ] Frontend (UI/UX)
- [ ] Backend (Adapters/APIs)
- [ ] Storage (AsyncStorage/FileSystem)
- [ ] CI/CD
- [ ] Documentation
- [ ] Other: ___________

## Ticket Reference
<!-- Link to ticket: A1, A2, C1, etc. -->
**Ticket:** [A#] <!-- e.g., [A1] Initialize Expo Project -->

## Screenshots
<!-- Required for UI changes. Include iOS & Android if applicable -->
### iOS
<!-- Add screenshot here -->

### Android
<!-- Add screenshot here -->

## Tests
<!-- Check all that apply -->
- [ ] Unit tests added/updated (coverage ≥80%)
- [ ] Integration tests added/updated
- [ ] E2E tests added/updated (if applicable)
- [ ] Accessibility tested (VoiceOver/TalkBack)
- [ ] Manual testing complete on device matrix

**Test Evidence:**
<!-- Paste test output or link to test report -->
```
npm test -- --coverage
```

## Risks
<!-- What could go wrong? Any breaking changes? -->
- [ ] No known risks
- [ ] Potential risk: ___________
  - **Mitigation:** ___________

## Rollback Plan
<!-- How to revert if this breaks production? -->
1. Revert commit: `git revert <commit-hash>`
2. Redeploy previous version
3. Other: ___________

## Checklist
- [ ] TypeScript compiles with 0 errors
- [ ] ESLint passes with 0 warnings
- [ ] Tests pass (unit, integration, a11y)
- [ ] Branch is up-to-date with base branch
- [ ] CODEOWNERS approvals obtained (ENG-LEAD + QA)
- [ ] Follows Conventional Commits format
- [ ] No secrets/credentials committed
- [ ] Bundle size within limits (<10MB)

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
