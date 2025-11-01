# Testing Strategy for PetFoodVerifAI

## Overview

This document outlines the comprehensive testing strategy for the PetFoodVerifAI application, covering both frontend (React) and backend (.NET 8) testing approaches.

## Frontend Testing Strategy

### Testing Pyramid

Our frontend follows the testing pyramid approach:

```
        /\
       /  \  E2E Tests (Playwright)
      /____\
     /      \
    /  Unit  \ Unit Tests (Vitest)
   /  Tests   \
  /____________\
```

### Unit Tests (Vitest)

**Coverage Target**: 70% minimum across all metrics

**What to Test**:
- React components (rendering, props, state changes)
- Custom hooks (data fetching, state management)
- Utility functions (data transformations, validations)
- Service layer (API calls with mocked responses)
- State management (context providers, reducers)

**File Naming Convention**: `*.test.ts` or `*.test.tsx`

**Priority Areas**:
1. Authentication flows (login, register, forgot password)
2. Form validation logic
3. Data transformation utilities
4. Custom React hooks
5. Error handling

### E2E Tests (Playwright)

**What to Test**:
- Critical user journeys
- Multi-page workflows
- Integration with backend APIs
- Visual regression testing
- Accessibility compliance

**Page Objects**:
- Login flow
- Registration flow
- Password reset flow
- Product analysis flow
- User dashboard
- Settings/Profile management

**Priority User Journeys**:
1. User registration and email verification
2. Login with various authentication methods
3. Pet food product analysis submission
4. Viewing analysis results and history
5. Submitting feedback
6. Password recovery flow

### Test Organization

```
frontend/
├── src/
│   ├── components/
│   │   └── Button.test.tsx
│   ├── hooks/
│   │   └── useLogin.test.ts
│   ├── services/
│   │   └── authService.test.ts
│   ├── utils/
│   │   └── validation.test.ts
│   └── tests/
│       └── setupTests.ts
└── e2e/
    ├── pages/
    │   ├── BasePage.ts
    │   ├── LoginPage.ts
    │   └── HomePage.ts
    ├── fixtures/
    │   └── test-fixtures.ts
    └── auth.spec.ts
```

## Backend Testing Strategy

### Unit Tests (xUnit)

**Coverage Target**: 70% minimum

**What to Test**:
- Service layer logic
- Business rule validation
- Data transformations
- API controllers (with mocked dependencies)
- Authentication/Authorization logic

**File Naming Convention**: `*Tests.cs`

**Priority Areas**:
1. AuthService (registration, login, token generation)
2. AnalysisService (product analysis logic)
3. LLMService (prompt generation, response parsing)
4. ScrapingService (data extraction)
5. Email service functionality

### Integration Tests

**What to Test**:
- Database operations
- External API integrations
- Complete request/response cycles
- Authentication middleware

**Test Database**: Use in-memory SQLite for integration tests

### Test Organization

```
PetFoodVerifAI.Tests/
├── Unit/
│   ├── Services/
│   │   ├── AuthServiceTests.cs
│   │   ├── AnalysisServiceTests.cs
│   │   └── LLMServiceTests.cs
│   └── Controllers/
│       ├── AuthControllerTests.cs
│       └── AnalysesControllerTests.cs
└── Integration/
    ├── AuthFlowTests.cs
    └── AnalysisFlowTests.cs
```

## Test Data Management

### Frontend Test Data

- **Mock API responses**: Store in `src/tests/mocks/`
- **Test fixtures**: Define in `e2e/fixtures/`
- **User personas**: Define reusable test users

### Backend Test Data

- **Seed data**: Create helper methods for test data generation
- **Mock external services**: Use interfaces and mock implementations
- **Database fixtures**: Use Entity Framework InMemory provider

## Continuous Integration

### Pre-commit Checks

- Run unit tests
- Check code coverage thresholds
- Run linter

### PR Checks

- All unit tests pass
- E2E tests pass for critical flows
- Code coverage meets minimums
- No regressions in visual tests

### CI Pipeline

```yaml
1. Install dependencies
2. Run unit tests (frontend & backend)
3. Generate coverage reports
4. Run E2E tests
5. Upload artifacts (coverage, screenshots, videos)
6. Report results
```

## Test Maintenance

### Regular Activities

1. **Weekly**: Review and update flaky tests
2. **Per Sprint**: Add tests for new features
3. **Monthly**: Review coverage reports and identify gaps
4. **Quarterly**: Refactor and optimize test suite

### Test Hygiene

- Remove obsolete tests
- Update tests when requirements change
- Keep test dependencies up to date
- Monitor test execution time
- Parallelize where possible

## Performance Testing

### Frontend Performance

- Lighthouse CI for performance metrics
- Bundle size monitoring
- React component render performance

### Backend Performance

- API endpoint response time benchmarks
- Database query performance
- Load testing for critical endpoints

## Security Testing

### Frontend

- XSS prevention validation
- CSRF token handling
- Secure storage of sensitive data

### Backend

- SQL injection prevention
- Authentication/Authorization tests
- Input validation and sanitization
- Rate limiting

## Accessibility Testing

- Automated checks with Playwright
- Screen reader compatibility
- Keyboard navigation
- WCAG 2.1 AA compliance

## Monitoring and Reporting

### Metrics to Track

- Test coverage percentage
- Test execution time
- Flaky test rate
- Test failure rate
- Time to fix failing tests

### Reports

- Coverage reports (HTML, LCOV)
- Test execution reports
- Visual regression reports
- Performance benchmarks

## Tools and Technologies

### Frontend

- **Test Runner**: Vitest
- **Component Testing**: React Testing Library
- **E2E Testing**: Playwright
- **Coverage**: @vitest/coverage-v8
- **Visual Testing**: Playwright screenshots
- **Mocking**: vi (Vitest)

### Backend

- **Test Framework**: xUnit
- **Mocking**: Moq
- **Test Database**: InMemory SQLite
- **API Testing**: WebApplicationFactory
- **Coverage**: Coverlet

## Getting Started

### For Developers

1. Read `frontend/TESTING.md` for detailed testing guide
2. Review existing test examples
3. Follow TDD when adding new features
4. Aim for meaningful tests, not just coverage numbers

### Writing Your First Test

#### Frontend Unit Test

```typescript
import { describe, it, expect } from 'vitest';

describe('MyComponent', () => {
  it('should render', () => {
    // Test implementation
  });
});
```

#### Frontend E2E Test

```typescript
import { test, expect } from './fixtures/test-fixtures';

test('user can login', async ({ loginPage }) => {
  await loginPage.navigate();
  await loginPage.login('user@example.com', 'password');
  await expect(page).toHaveURL('/dashboard');
});
```

#### Backend Unit Test

```csharp
[Fact]
public async Task Login_WithValidCredentials_ReturnsToken()
{
    // Arrange
    var authService = new AuthService();
    
    // Act
    var result = await authService.LoginAsync("user@example.com", "password");
    
    // Assert
    Assert.NotNull(result.Token);
}
```

## References

- [Frontend Testing Guide](../frontend/TESTING.md)
- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [xUnit Documentation](https://xunit.net/)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)
