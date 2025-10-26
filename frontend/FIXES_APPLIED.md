# Bug Fixes Applied to Analyze View

## Issues Fixed

### 1. ✅ Species Enum Conversion Error (400 Bad Request)

**Problem**: Backend was receiving string values ("Cat", "Dog") but expected numeric enum values (0, 1) for the Species field.

**Root Cause**: ASP.NET Core's default JSON serialization expects numeric values for enums unless configured with `JsonStringEnumConverter`.

**Solution**:
- Updated `CreateAnalysisRequest` to accept `species: 0 | 1` instead of string
- Added `speciesStringToEnum()` helper function to convert "Cat" → 0, "Dog" → 1
- Frontend now sends numeric enum values matching backend expectations

**Files Changed**:
- `frontend/src/types/analyze.ts` - Added helper function
- `frontend/src/views/analyze/AnalyzePage.tsx` - Use helper to convert species

---

### 2. ✅ Loading State Persisting After Errors

**Problem**: When API errors occurred, the form stayed in "loading" state indefinitely, preventing users from retrying.

**Root Cause**: The scrape state was managed locally in the form but API errors were handled in the parent, causing state synchronization issues.

**Solution**:
- Moved scrape state management to `AnalyzePage` (parent component)
- Pass `scrapeStateFromParent` prop to `AnalyzeForm` for API-driven state changes
- Reset scrape state appropriately for each error type:
  - **401 (Unauthorized)**: Reset to 'idle' before redirecting to login
  - **400 (Validation)**: Reset to 'idle' so user can correct errors
  - **503 (Service Unavailable)**: Set to 'awaitingManual' to trigger manual entry
  - **Other errors**: Reset to 'idle' to allow retry

**Files Changed**:
- `frontend/src/views/analyze/AnalyzePage.tsx` - Added scrape state management with proper error handling
- `frontend/src/views/analyze/components/AnalyzeForm.tsx` - Accept parent scrape state prop

---

### 3. ✅ Scrape State and API Integration

**Problem**: Confusion about whether API provides scraping status updates.

**Clarification**: The backend does NOT stream scraping status. The API is synchronous:
- **Request**: POST /api/analyses
- **Success**: 201 with analysis results (scraping succeeded internally)
- **Failure**: 503 if scraping or LLM service fails

**Frontend Behavior**:
- Show "scraping" state immediately when user submits (UX feedback)
- If 503 error received, transition to "awaitingManual" state
- Manual ingredient entry is a frontend UX feature to handle scraping failures gracefully

**User Flow**:
1. User submits form → Show "Scraping..." status
2. Backend attempts to scrape internally
3. If scraping fails → Backend returns 503
4. Frontend catches 503 → Shows manual entry option
5. User enters ingredients manually → Resubmit with `ingredientsText`

---

## Testing Checklist

- [ ] Submit form with valid data → Should succeed
- [ ] Submit form without manual ingredients → Should show "scraping" status
- [ ] Receive 400 error → Loading should clear, show validation errors
- [ ] Receive 503 error → Should offer manual ingredient entry
- [ ] Enter manual ingredients and resubmit → Should succeed
- [ ] Receive 401 error → Should redirect to login
- [ ] Form validation errors → Should focus first error field

---

## Backend Configuration Note

**Alternative Solution** (Backend change):
If you prefer to keep sending strings, add this to `Program.cs`:

```csharp
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });
```

This would allow the backend to accept both numeric values (0, 1) and string values ("Cat", "Dog").

The current frontend fix works with the default backend configuration (no changes needed).

