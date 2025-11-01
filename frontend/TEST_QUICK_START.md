# Testing Quick Start Guide

## 🚀 Quick Start

### Run Unit Tests

```bash
# Run all tests
npm test

# Watch mode (recommended during development)
npm run test:watch

# With coverage
npm run test:coverage

# With UI
npm run test:ui
```

### Run E2E Tests

```bash
# Run all E2E tests
npm run e2e

# Run with UI mode
npm run e2e:ui

# Run in headed mode (see browser)
npm run e2e:headed

# Debug mode
npm run e2e:debug

# Generate tests interactively
npm run e2e:codegen

# View last test report
npm run e2e:report
```

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   └── Button.test.tsx          # Unit tests next to components
│   ├── hooks/
│   │   └── useLogin.test.ts         # Hook tests
│   ├── services/
│   │   └── authService.test.ts      # Service tests
│   └── tests/
│       └── setupTests.ts            # Test setup
└── e2e/
    ├── pages/                        # Page Object Model
    │   ├── BasePage.ts
    │   ├── LoginPage.ts
    │   └── HomePage.ts
    ├── fixtures/
    │   └── test-fixtures.ts          # Custom fixtures
    └── example.spec.ts               # E2E test specs
```

## ✍️ Writing Tests

### Unit Test Example

```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('should render text', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

### E2E Test Example

```typescript
import { test, expect } from './fixtures/test-fixtures';

test('user can login', async ({ loginPage }) => {
  await loginPage.navigate();
  await loginPage.login('user@test.com', 'password123');
  await expect(page).toHaveURL('/dashboard');
});
```

## 🎯 What to Test

### Unit Tests
- ✅ Component rendering
- ✅ User interactions
- ✅ Custom hooks
- ✅ Utility functions
- ✅ Service/API calls (mocked)
- ✅ State management

### E2E Tests
- ✅ Critical user journeys
- ✅ Authentication flows
- ✅ Multi-page workflows
- ✅ Form submissions
- ✅ Visual regression

## 📊 Coverage

- **Target**: 70% minimum
- **View report**: `npm run test:coverage`
- **Report location**: `coverage/index.html`

## 🐛 Debugging

### Unit Tests
1. Add `debugger;` statement
2. Use `npm run test:ui` for visual debugging
3. Use console.log
4. Set breakpoints in VS Code

### E2E Tests
1. Run `npm run e2e:debug`
2. Use `npm run e2e:headed` to see browser
3. Check `test-results/` for screenshots/videos
4. Use trace viewer for failed tests

## 📚 Full Documentation

For comprehensive documentation, see:
- [Complete Testing Guide](./TESTING.md)
- [Test Plan](./../.ai/test-plan.md)
- [Vitest Cursor Rule](../.cursor/rules/vitest-unit-testing.mdc)
- [Playwright Cursor Rule](../.cursor/rules/playwright-testing.mdc)

## 🔗 Resources

- [Vitest Docs](https://vitest.dev/)
- [Playwright Docs](https://playwright.dev/)
- [Testing Library Docs](https://testing-library.com/)

