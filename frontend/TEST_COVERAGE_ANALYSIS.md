# TIER 1 Test Coverage Analysis
**Generated:** October 26, 2025  
**Analyzed By:** Front-End Test Assessment

---

## Executive Summary

**Current State:** ❌ **0/6 Critical Components Have Tests**

All TIER 1 critical components currently **lack test coverage**. While the project has testing infrastructure in place (Vitest, React Testing Library), only login-related functionality has tests.

### Existing Test Coverage
✅ **LoginView** - Has tests  
✅ **useLogin hook** - Has tests  
✅ **NotFound components** - Has comprehensive tests (5 files)

### Missing Critical Test Coverage (TIER 1)
❌ **AuthContext.tsx** - No tests  
❌ **SessionExpiredContext.tsx** - No tests  
❌ **UiContext.tsx** - No tests  
❌ **resultsMappers.ts** - No tests  
❌ **normalizeApiErrors.ts** - No tests  
❌ **useAnalyzeForm.ts** - No tests

---

## Detailed Component Analysis

### 1. ✅ EXISTING: LoginView & useLogin Hook
**Status:** ✅ Tests exist at `frontend/src/tests/useLogin.test.tsx`

**Current Coverage:**
- ✅ Successful login with token and userId
- ✅ Email normalization (lowercase conversion)
- ✅ 401 credential errors
- ✅ 429 rate limit errors
- ✅ Auth context integration

**Assessment:** Good coverage for login flow.

---

### 2. ❌ MISSING: AuthContext.tsx
**Priority:** 🔴 CRITICAL  
**Complexity:** Medium  
**Estimated Time:** 3 hours  
**File:** `frontend/src/state/auth/AuthContext.tsx`

#### Why Critical
- Controls all authentication state
- Manages localStorage persistence
- Foundation for app security
- Used throughout the application

#### Required Test Coverage

##### A. Context Provider Tests
```typescript
describe('AuthProvider', () => {
  test('should initialize with empty state')
  test('should load persisted auth state from localStorage on mount')
  test('should handle corrupted localStorage data gracefully')
  test('should handle missing localStorage gracefully (SSR)')
})
```

##### B. Login Function Tests
```typescript
describe('login', () => {
  test('should set token and user data')
  test('should persist auth state to localStorage')
  test('should update isAuthenticated to true')
  test('should handle multiple login calls')
})
```

##### C. Logout Function Tests
```typescript
describe('logout', () => {
  test('should clear auth state')
  test('should remove data from localStorage')
  test('should set isAuthenticated to false')
  test('should clear user object')
})
```

##### D. isAuthenticated Computed Property
```typescript
describe('isAuthenticated', () => {
  test('should be false when no token exists')
  test('should be true when token exists')
  test('should update reactively when token changes')
})
```

##### E. Hook Error Handling
```typescript
describe('useAuth hook', () => {
  test('should throw error when used outside AuthProvider')
  test('should return context value when used inside AuthProvider')
})
```

##### F. Persistence Edge Cases
```typescript
describe('localStorage persistence', () => {
  test('should handle localStorage.setItem errors gracefully')
  test('should handle localStorage.getItem errors gracefully')
  test('should handle JSON.parse errors')
  test('should handle quota exceeded errors')
})
```

**Total Test Cases:** ~15-18 tests

---

### 3. ❌ MISSING: SessionExpiredContext.tsx
**Priority:** 🔴 CRITICAL  
**Complexity:** High  
**Estimated Time:** 4 hours  
**File:** `frontend/src/state/session/SessionExpiredContext.tsx`

#### Why Critical
- Intercepts all fetch requests globally
- Handles 401 responses automatically
- Manages security-sensitive session logic
- Complex behavior with multiple hooks and effects

#### Required Test Coverage

##### A. Context Provider Tests
```typescript
describe('SessionExpiredProvider', () => {
  test('should initialize with non-expired state')
  test('should load persisted expiry flag from sessionStorage')
  test('should restore expired state from sessionStorage on mount')
  test('should handle missing sessionStorage gracefully')
})
```

##### B. triggerExpiry Function
```typescript
describe('triggerExpiry', () => {
  test('should set isExpired to true')
  test('should use default message when none provided')
  test('should use custom message when provided')
  test('should set returnPath correctly')
  test('should set sourceRequest correctly')
  test('should prevent duplicate triggers with same message')
  test('should allow re-trigger with different message')
  test('should sanitize returnPath (reject //, external URLs)')
})
```

##### C. clearExpiry Function
```typescript
describe('clearExpiry', () => {
  test('should reset state to initial values')
  test('should clear sessionStorage flag')
  test('should clear returnPath')
})
```

##### D. setReturnPath Function
```typescript
describe('setReturnPath', () => {
  test('should set valid return path')
  test('should reject external URLs')
  test('should reject paths starting with //')
  test('should accept paths starting with /')
  test('should handle undefined input')
})
```

##### E. Fetch Interceptor (Most Complex)
```typescript
describe('fetch interceptor', () => {
  test('should register interceptor on mount')
  test('should intercept 401 API responses')
  test('should NOT trigger on /auth/login endpoint')
  test('should NOT trigger on /auth/register endpoint')
  test('should ignore non-API requests')
  test('should respect ignorePaths option')
  test('should restore original fetch on unmount')
  test('should not re-register interceptor multiple times')
  test('should pass through non-401 responses unchanged')
  test('should handle Request object URLs')
  test('should handle string URLs')
  test('should set returnPath from location.pathname')
})
```

##### F. useSessionExpiry Hook
```typescript
describe('useSessionExpiry', () => {
  test('should throw error when used outside provider')
  test('should return expiry state correctly')
  test('should update returnPath when location changes')
  test('should NOT set returnPath for public routes (/login, /register, /)')
})
```

##### G. handleLoginRedirect Function
```typescript
describe('handleLoginRedirect', () => {
  test('should clear pfvauth from localStorage')
  test('should navigate to /login')
  test('should preserve returnUrl in query params')
  test('should NOT preserve returnUrl for public paths')
  test('should handle localStorage clear errors gracefully')
  test('should encode returnUrl correctly')
})
```

##### H. SessionStorage Persistence
```typescript
describe('sessionStorage persistence', () => {
  test('should persist expiry flag when isExpired changes')
  test('should remove flag when cleared')
  test('should handle setItem errors gracefully')
  test('should handle getItem errors gracefully')
})
```

**Total Test Cases:** ~35-40 tests

---

### 4. ❌ MISSING: UiContext.tsx
**Priority:** 🔴 CRITICAL  
**Complexity:** Medium  
**Estimated Time:** 2 hours  
**File:** `frontend/src/state/ui/UiContext.tsx`

#### Why Critical
- Global alert management
- Timer-based auto-dismiss logic
- Loading state for entire app
- Memory leak potential with timers

#### Required Test Coverage

##### A. Context Provider Tests
```typescript
describe('UiProvider', () => {
  test('should initialize with empty alerts array')
  test('should initialize with loading state false')
})
```

##### B. addAlert Function
```typescript
describe('addAlert', () => {
  test('should add alert with generated unique ID')
  test('should add alert to alerts array')
  test('should support all severity types (info, success, warning, error)')
  test('should include optional title')
  test('should auto-dismiss by default after 5000ms')
  test('should use custom dismissAfter value')
  test('should NOT auto-dismiss when autoDismiss is false')
  test('should generate unique IDs for concurrent alerts')
  test('should handle multiple alerts simultaneously')
  test('should append new alerts to end of array')
})
```

##### C. removeAlert Function
```typescript
describe('removeAlert', () => {
  test('should remove alert by ID')
  test('should handle removing non-existent ID gracefully')
  test('should not affect other alerts')
  test('should remove correct alert when multiple exist')
})
```

##### D. Auto-Dismiss Timer Logic
```typescript
describe('auto-dismiss timers', () => {
  test('should dismiss alert after default 5000ms')
  test('should dismiss alert after custom time')
  test('should cancel timer if alert manually removed before timeout')
  test('should not create memory leaks with timers')
  test('should handle multiple timers for multiple alerts')
})
```

##### E. setLoading Function
```typescript
describe('setLoading', () => {
  test('should set loading state to true')
  test('should set loading state to false')
  test('should update loading label')
  test('should handle undefined label')
})
```

##### F. Hook Error Handling
```typescript
describe('useUiState hook', () => {
  test('should throw error when used outside UiProvider')
  test('should return context value when used inside UiProvider')
})
```

**Total Test Cases:** ~22-25 tests

---

### 5. ❌ MISSING: resultsMappers.ts
**Priority:** 🔴 CRITICAL  
**Complexity:** Medium  
**Estimated Time:** 4 hours  
**File:** `frontend/src/utils/resultsMappers.ts`

#### Why Critical
- 11 mapper functions
- UUID validation
- Date formatting and relative dates
- URL validation
- Error classification logic
- Data transformation between DTO and ViewModel

#### Required Test Coverage

##### A. mapAnalysisDetailToViewModel
```typescript
describe('mapAnalysisDetailToViewModel', () => {
  test('should map all DTO fields to ViewModel')
  test('should handle null productUrl')
  test('should map concerns array correctly')
  test('should handle empty concerns array')
  test('should handle missing concerns field')
  test('should preserve all pet info (species, breed, age)')
  test('should handle null additionalInfo')
  test('should handle null ingredientsText')
})
```

##### B. formatAnalysisDate
```typescript
describe('formatAnalysisDate', () => {
  test('should format valid ISO date to localized string')
  test('should use en-US locale')
  test('should include year, month, day, hour, minute')
  test('should use 12-hour format with AM/PM')
  test('should handle invalid date gracefully (return original)')
  test('should handle empty string')
  test('should handle malformed ISO string')
})
```

##### C. formatRelativeDate
```typescript
describe('formatRelativeDate', () => {
  test('should return "just now" for < 60 seconds')
  test('should return "X minutes ago" for < 60 minutes')
  test('should handle singular "1 minute ago"')
  test('should return "X hours ago" for < 24 hours')
  test('should handle singular "1 hour ago"')
  test('should return "X days ago" for < 30 days')
  test('should handle singular "1 day ago"')
  test('should fall back to formatAnalysisDate for >= 30 days')
  test('should handle invalid date gracefully')
  test('should handle future dates (negative diff)')
})
```

##### D. formatPetSummary
```typescript
describe('formatPetSummary', () => {
  test('should format with age, breed, and species')
  test('should handle singular "1 year old"')
  test('should handle plural "X years old"')
  test('should handle null breed (omit from output)')
  test('should handle null age (omit from output)')
  test('should always include species')
  test('should format: "2 years old Golden Retriever Dog"')
  test('should format: "Dog" when only species provided')
})
```

##### E. isValidUrl
```typescript
describe('isValidUrl', () => {
  test('should return true for valid HTTP URL')
  test('should return true for valid HTTPS URL')
  test('should return false for null')
  test('should return false for undefined')
  test('should return false for empty string')
  test('should return false for malformed URL')
  test('should return false for relative path')
  test('should handle URLs with ports')
  test('should handle URLs with query params')
})
```

##### F. classifyApiError
```typescript
describe('classifyApiError', () => {
  test('should classify 401 as unauthorized')
  test('should classify 404 as notFound')
  test('should classify 500 as server error')
  test('should classify 502 as server error')
  test('should classify 503 as server error')
  test('should classify 504 as server error')
  test('should classify unknown codes as network error')
  test('should use custom message when provided')
  test('should use default message when not provided')
  test('should return correct error type for each category')
})
```

##### G. isValidUuid
```typescript
describe('isValidUuid', () => {
  test('should return true for valid UUID v4')
  test('should return false for invalid format')
  test('should return false for undefined')
  test('should return false for empty string')
  test('should handle uppercase UUIDs')
  test('should handle lowercase UUIDs')
  test('should reject UUIDs with wrong segment lengths')
  test('should reject non-hex characters')
})
```

##### H. mapToReanalyzePayload
```typescript
describe('mapToReanalyzePayload', () => {
  test('should map ViewModel to ReanalyzePayload')
  test('should return null if productName missing')
  test('should return null if productUrl missing')
  test('should return null if breed missing')
  test('should return null if age is null')
  test('should include additionalInfo when present')
  test('should include ingredientsText when present')
  test('should handle undefined additionalInfo')
  test('should handle empty string ingredientsText')
  test('should preserve species correctly')
})
```

##### I. getRecommendationBadgeClass
```typescript
describe('getRecommendationBadgeClass', () => {
  test('should return green classes for Recommended')
  test('should return red classes for NotRecommended')
})
```

##### J. getRecommendationLabel
```typescript
describe('getRecommendationLabel', () => {
  test('should return "Recommended" for Recommended')
  test('should return "Not Recommended" for NotRecommended')
})
```

**Total Test Cases:** ~60-70 tests

---

### 6. ❌ MISSING: normalizeApiErrors.ts
**Priority:** 🔴 CRITICAL  
**Complexity:** Low  
**Estimated Time:** 1 hour  
**File:** `frontend/src/utils/normalizeApiErrors.ts`

#### Why Critical
- Foundation for all API error handling
- Used across login, register, and form submissions
- Data normalization logic

#### Required Test Coverage

##### A. Field Error Mapping
```typescript
describe('normalizeApiErrors', () => {
  test('should map array of field errors correctly')
  test('should use first error when multiple errors for same field')
  test('should use "form" as default field when field is null')
  test('should map multiple different field errors')
  test('should preserve field names exactly as provided')
})
```

##### B. Top-Level Message Handling
```typescript
describe('message handling', () => {
  test('should use top-level message as form error when no field errors exist')
  test('should NOT override field errors with top-level message')
  test('should add form error when field errors exist but no form error yet')
})
```

##### C. Fallback Error Handling
```typescript
describe('fallback errors', () => {
  test('should provide default error when no errors or message provided')
  test('should use "Something went wrong. Please try again." as default')
  test('should handle empty errors array')
  test('should handle null errors')
  test('should handle undefined errors')
})
```

##### D. Edge Cases
```typescript
describe('edge cases', () => {
  test('should handle empty object input')
  test('should handle errors with empty message strings')
  test('should handle errors with whitespace-only messages')
  test('should not crash on malformed error objects')
})
```

**Total Test Cases:** ~15-18 tests

---

### 7. ❌ MISSING: useAnalyzeForm.ts
**Priority:** 🔴 CRITICAL  
**Complexity:** High  
**Estimated Time:** 5 hours  
**File:** `frontend/src/views/analyze/hooks/useAnalyzeForm.ts`

#### Why Critical
- Complex reducer pattern
- 6 field validators
- Manual ingredients fallback logic
- Form state management for core feature
- Multiple interdependent states

#### Required Test Coverage

##### A. Initialization
```typescript
describe('initialization', () => {
  test('should initialize with default empty values')
  test('should initialize with provided initial values')
  test('should call initializeForm only once on mount')
  test('should handle partial initial values')
})
```

##### B. updateField Function
```typescript
describe('updateField', () => {
  test('should update productName field')
  test('should update productUrl field')
  test('should update species field')
  test('should update breed field')
  test('should update age field')
  test('should update additionalInfo field')
  test('should clear field error when field is updated')
  test('should not affect other fields')
})
```

##### C. Field Validators

```typescript
describe('validateProductName', () => {
  test('should pass valid product name')
  test('should fail when empty')
  test('should fail when only whitespace')
  test('should fail when < 2 characters')
  test('should trim whitespace before validation')
})

describe('validateProductUrl', () => {
  test('should pass valid HTTP URL')
  test('should pass valid HTTPS URL')
  test('should fail when empty')
  test('should fail when invalid URL format')
  test('should fail when malformed URL')
  test('should trim whitespace before validation')
})

describe('validateSpecies', () => {
  test('should pass "Cat"')
  test('should pass "Dog"')
  test('should fail when empty')
  test('should fail for invalid species')
  test('should be case-sensitive')
})

describe('validateBreed', () => {
  test('should pass valid breed name')
  test('should fail when empty')
  test('should fail when only whitespace')
  test('should fail when < 2 characters')
  test('should fail when only numbers')
  test('should allow alphanumeric breeds')
})

describe('validateAge', () => {
  test('should pass valid age (1-20)')
  test('should fail when empty')
  test('should fail when null')
  test('should fail when undefined')
  test('should fail when < 1')
  test('should fail when 0')
  test('should fail when negative')
  test('should fail for decimal numbers')
  test('should require whole numbers only')
})

describe('validateIngredientsText', () => {
  test('should pass when not in manual mode')
  test('should pass when noIngredientsAvailable is checked')
  test('should fail when manual mode and empty')
  test('should fail when < 10 characters in manual mode')
  test('should pass valid ingredients text')
  test('should trim whitespace before validation')
})
```

##### D. handleBlur Function
```typescript
describe('handleBlur', () => {
  test('should validate productName on blur')
  test('should trim productName on blur')
  test('should validate productUrl on blur')
  test('should trim productUrl on blur')
  test('should validate species on blur')
  test('should validate breed on blur')
  test('should trim breed on blur')
  test('should validate age on blur')
  test('should validate ingredientsText on blur')
  test('should set error in formErrors when validation fails')
  test('should not set error when validation passes')
})
```

##### E. validateForm Function
```typescript
describe('validateForm', () => {
  test('should return true when all fields valid')
  test('should return false when any field invalid')
  test('should collect all validation errors')
  test('should validate all required fields')
  test('should skip optional fields')
  test('should set showValidationSummary when errors exist')
  test('should clear showValidationSummary when no errors')
  test('should validate conditionally based on manual ingredients mode')
})
```

##### F. Manual Ingredients Logic
```typescript
describe('enableManualIngredients', () => {
  test('should set hasManualIngredients to true')
  test('should set scrapeState to "manualReady"')
})

describe('resetManualIngredients', () => {
  test('should set hasManualIngredients to false')
  test('should clear ingredientsText')
  test('should clear noIngredientsAvailable')
  test('should reset scrapeState to "idle"')
})

describe('updateManualIngredients', () => {
  test('should update ingredientsText value')
  test('should clear ingredientsText error')
  test('should not affect other form values')
})

describe('toggleNoIngredients', () => {
  test('should set noIngredientsAvailable when checked')
  test('should clear ingredientsText error when checked')
  test('should unset noIngredientsAvailable when unchecked')
})
```

##### G. Reducer Actions
```typescript
describe('formReducer', () => {
  test('should handle SET_FIELD action')
  test('should handle SET_MANUAL_INGREDIENTS action')
  test('should handle SET_NO_INGREDIENTS action')
  test('should handle ENABLE_MANUAL action')
  test('should handle RESET_MANUAL action')
  test('should handle RESET_FORM action')
  test('should handle INIT_FORM action')
  test('should return unchanged state for unknown action')
})
```

##### H. Integration Tests
```typescript
describe('integration scenarios', () => {
  test('should handle complete form fill and validation')
  test('should handle form reset after submission')
  test('should handle switching between auto and manual ingredients')
  test('should preserve form state when toggling manual mode')
  test('should handle validation errors across multiple fields')
  test('should clear errors as user fixes them')
})
```

**Total Test Cases:** ~80-90 tests

---

## Summary Statistics

| Component | Status | Test Cases | Estimated Time |
|-----------|--------|-----------|----------------|
| AuthContext.tsx | ❌ Missing | ~15-18 | 3 hours |
| SessionExpiredContext.tsx | ❌ Missing | ~35-40 | 4 hours |
| UiContext.tsx | ❌ Missing | ~22-25 | 2 hours |
| resultsMappers.ts | ❌ Missing | ~60-70 | 4 hours |
| normalizeApiErrors.ts | ❌ Missing | ~15-18 | 1 hour |
| useAnalyzeForm.ts | ❌ Missing | ~80-90 | 5 hours |
| **TOTAL** | **0/6** | **~227-261** | **19 hours** |

---

## Recommendations

### Priority Order for Implementation

1. **normalizeApiErrors.ts** (1 hour)
   - Simplest to test
   - Foundation for other tests
   - High impact, low effort

2. **resultsMappers.ts** (4 hours)
   - Pure functions, easy to test
   - No React dependencies
   - High test count but straightforward

3. **AuthContext.tsx** (3 hours)
   - Core authentication
   - Required for most features
   - Moderate complexity

4. **UiContext.tsx** (2 hours)
   - Timer management needs careful testing
   - Used throughout app
   - Moderate complexity

5. **useAnalyzeForm.ts** (5 hours)
   - Most complex hook
   - Core business logic
   - High test count

6. **SessionExpiredContext.tsx** (4 hours)
   - Most complex due to fetch interceptor
   - Save for when experienced with testing patterns
   - High complexity

---

## Testing Infrastructure Status

### ✅ Already Configured
- Vitest test runner
- @testing-library/react
- @testing-library/jest-dom
- jsdom environment
- Setup file configured

### 📦 Test Utilities Needed
Consider adding:
- `@testing-library/user-event` - Already installed ✅
- Mock utilities for localStorage/sessionStorage
- Timer utilities (vi.useFakeTimers already in use)
- Custom render functions for context providers

---

## Next Steps

1. ✅ **This Analysis** - Complete understanding of gaps
2. **Create Test Files** - Set up test file structure
3. **Write Tests** - Follow priority order above
4. **Achieve Coverage** - Aim for >80% on critical paths
5. **CI Integration** - Add to GitHub Actions (if applicable)

---

**Note:** All test estimations include:
- Writing test code
- Running and debugging tests
- Achieving passing status
- Basic documentation

Does NOT include:
- Fixing bugs discovered by tests
- Refactoring code for testability
- Setting up CI/CD pipelines

