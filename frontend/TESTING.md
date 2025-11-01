# Testing Guide for PetFoodVerifAI Frontend

This document provides comprehensive guidelines for writing and running tests in the PetFoodVerifAI frontend application.

## Table of Contents

- [Overview](#overview)
- [Testing Stack](#testing-stack)
- [Unit Testing with Vitest](#unit-testing-with-vitest)
- [E2E Testing with Playwright](#e2e-testing-with-playwright)
- [Running Tests](#running-tests)
- [Best Practices](#best-practices)
- [CI/CD Integration](#cicd-integration)

## Overview

The PetFoodVerifAI frontend uses a comprehensive testing approach:

- **Unit Tests**: Test individual components, hooks, and utilities in isolation using Vitest
- **E2E Tests**: Test complete user flows and interactions using Playwright

## Testing Stack

### Unit Testing
- **Vitest**: Fast unit test framework with native ES modules support
- **React Testing Library**: For testing React components
- **@vitest/ui**: Visual UI for exploring test results
- **@vitest/coverage-v8**: Code coverage reporting

### E2E Testing
- **Playwright**: Modern E2E testing framework
- **Chromium**: Browser engine for running tests
- **Page Object Model**: Design pattern for maintainable test code

## Unit Testing with Vitest

### Writing Unit Tests

Unit tests are located alongside the code they test, typically with a `.test.ts` or `.test.tsx` extension.

#### Testing a React Component

```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('should render successfully', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });

  it('should handle user interactions', async () => {
    const { user } = render(<MyComponent />);
    const button = screen.getByRole('button', { name: /click me/i });
    
    await user.click(button);
    
    expect(screen.getByText('Clicked!')).toBeInTheDocument();
  });
});
```

#### Testing a Custom Hook

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useMyHook } from './useMyHook';

describe('useMyHook', () => {
  it('should fetch data successfully', async () => {
    const { result } = renderHook(() => useMyHook());
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    expect(result.current.data).toBeDefined();
  });
});
```

#### Mocking with Vitest

```typescript
import { vi } from 'vitest';

// Mock a module
vi.mock('./api', () => ({
  fetchData: vi.fn(() => Promise.resolve({ data: 'mocked' })),
}));

// Spy on a function
const spy = vi.spyOn(console, 'log');

// Mock global
vi.stubGlobal('fetch', vi.fn());
```

### Coverage Configuration

Coverage thresholds are configured in `vite.config.ts`:

- **Lines**: 70%
- **Functions**: 70%
- **Branches**: 70%
- **Statements**: 70%

Coverage reports are generated in the `coverage/` directory and include:
- Text summary in the console
- HTML report for detailed visualization
- JSON and LCOV formats for CI integration

## E2E Testing with Playwright

### Page Object Model

E2E tests use the Page Object Model pattern to create maintainable and reusable test code.

#### Directory Structure

```
e2e/
├── pages/              # Page Object classes
│   ├── BasePage.ts     # Base class with common functionality
│   ├── LoginPage.ts    # Login page object
│   └── HomePage.ts     # Home page object
├── fixtures/           # Test fixtures
│   └── test-fixtures.ts # Custom test fixtures
└── *.spec.ts           # Test specifications
```

#### Creating a Page Object

```typescript
import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class MyPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  // Locators using resilient selectors
  get submitButton() {
    return this.getByRole('button', { name: /submit/i });
  }

  get emailInput() {
    return this.getByLabel(/email/i);
  }

  // Actions
  async navigate() {
    await this.goto('/my-page');
    await this.waitForPageLoad();
  }

  async submitForm(email: string) {
    await this.emailInput.fill(email);
    await this.submitButton.click();
  }
}
```

#### Writing E2E Tests

```typescript
import { test, expect } from './fixtures/test-fixtures';

test.describe('My Feature', () => {
  test.beforeEach(async ({ myPage }) => {
    await myPage.navigate();
  });

  test('should complete user flow', async ({ myPage }) => {
    // Arrange
    const testEmail = 'test@example.com';

    // Act
    await myPage.submitForm(testEmail);

    // Assert
    await expect(myPage.getByText('Success')).toBeVisible();
  });
});
```

### Playwright Best Practices

1. **Use resilient locators**: Prefer `getByRole`, `getByLabel`, `getByText` over CSS selectors
2. **Implement proper waits**: Use auto-waiting features instead of arbitrary timeouts
3. **Isolate tests**: Use browser contexts for test isolation
4. **Visual testing**: Use `expect(page).toHaveScreenshot()` for visual regression testing
5. **API testing**: Leverage Playwright's API testing capabilities for backend validation
6. **Debug effectively**: Use trace viewer and headed mode for debugging

## Running Tests

### Unit Tests

```bash
# Run all unit tests
npm test

# Run tests in watch mode (recommended for development)
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests with UI (visual test explorer)
npm run test:ui
```

### E2E Tests

```bash
# Run all E2E tests
npm run e2e

# Run with UI mode (visual test execution)
npm run e2e:ui

# Run in headed mode (see the browser)
npm run e2e:headed

# Debug tests
npm run e2e:debug

# Generate tests using codegen
npm run e2e:codegen

# View test report
npm run e2e:report
```

## Best Practices

### General Testing Principles

1. **Arrange-Act-Assert**: Structure tests clearly
   ```typescript
   test('descriptive name', () => {
     // Arrange: Set up test data
     const input = 'test';
     
     // Act: Perform the action
     const result = myFunction(input);
     
     // Assert: Verify the result
     expect(result).toBe('expected');
   });
   ```

2. **Test behavior, not implementation**: Focus on what the user sees and does

3. **Write descriptive test names**: Test names should describe the scenario and expected outcome

4. **Keep tests isolated**: Tests should not depend on each other

5. **Use meaningful assertions**: Include custom error messages when helpful

### Unit Testing Best Practices

1. **Mock external dependencies**: Keep tests fast and reliable
2. **Test edge cases**: Cover happy path, error cases, and boundary conditions
3. **Use setup and teardown**: Leverage `beforeEach` and `afterEach` for common setup
4. **Keep tests simple**: One concept per test
5. **Avoid testing implementation details**: Focus on public API and user-facing behavior

### E2E Testing Best Practices

1. **Test critical user journeys**: Focus on the most important flows
2. **Use data-testid sparingly**: Prefer semantic selectors
3. **Parallelize tests**: Take advantage of Playwright's parallel execution
4. **Use fixtures**: Share common setup across tests
5. **Visual regression testing**: Catch UI changes automatically
6. **API testing**: Validate backend responses within E2E tests

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npx playwright install chromium --with-deps
      - run: npm run e2e
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

### Pre-commit Hooks

Add to `.husky/pre-commit`:

```bash
#!/bin/sh
npm test
```

### Code Coverage in CI

The coverage reports are automatically generated and can be integrated with services like:
- Codecov
- Coveralls
- SonarQube

## Debugging Tests

### Debugging Unit Tests

1. **Use Vitest UI**: `npm run test:ui` - Visual interface for exploring tests
2. **Add debugger statements**: Place `debugger;` in your test
3. **Use console.log**: Add logging to understand test flow
4. **VSCode debugging**: Set breakpoints and use the Debug Test CodeLens

### Debugging E2E Tests

1. **Headed mode**: `npm run e2e:headed` - See the browser
2. **Debug mode**: `npm run e2e:debug` - Step through tests
3. **Trace viewer**: Review traces of failed tests
4. **Screenshots and videos**: Check `test-results/` directory
5. **Codegen**: `npm run e2e:codegen` - Generate tests interactively

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)

## Need Help?

- Check existing test files for examples
- Review the Cursor rules in `.cursor/rules/`
- Consult the team documentation in `.ai/`

