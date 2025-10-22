## View Implementation Plan – Landing

## 1. Overview
The Landing view is the pre-auth entry point at `/`. It briefly explains what PetFoodVerifAI does, clarifies PoC limitations (single store, cats/dogs only), displays a privacy note and an AI disclaimer, and drives users to register or log in. No authenticated data is rendered on this page.

## 2. View Routing
- Path: `/`
- Access: Public (no auth required). If the user is already authenticated, optionally redirect them to the main analysis form route (e.g., `/analyze`).

## 3. Component Structure
- `LandingView`
  - `MarketingHero`
  - `HowItWorks`
  - `PoCScopeNotice`
  - `PrimaryCTAButtons`
  - `FooterLinks`

Component tree (high-level):
```
LandingView (route: "/")
  ├─ MarketingHero
  ├─ HowItWorks
  ├─ PoCScopeNotice
  ├─ PrimaryCTAButtons
  └─ FooterLinks
```

## 4. Component Details
### MarketingHero
- Component description: Hero section with concise headline, value proposition, and brief supporting copy.
- Main elements: semantic container (`<header>`), `<h1>`, `<p>`, optional illustration `<img>` with `alt`.
- Handled interactions: none (static content only).
- Handled validation: none.
- Types: `MarketingHeroProps`.
- Props:
  - `headline: string`
  - `subheadline: string`
  - `illustrationSrc?: string`
  - `illustrationAlt?: string`

### HowItWorks
- Component description: Three-step explanation of the flow (submit URL + pet details → ingredient scraping or manual input → AI recommendation and save to history).
- Main elements: `<section>` with `<h2>`, ordered list `<ol>` of steps, each step with icon and descriptive text.
- Handled interactions: none (static; links inside are optional and internal anchors).
- Handled validation: none.
- Types: `HowItWorksProps`, `HowStep`.
- Props:
  - `steps: HowStep[]`

### PoCScopeNotice
- Component description: Clear PoC scope boundaries and limitations per PRD: single predefined store, cats/dogs only, login required, AI disclaimer, privacy note.
- Main elements: `<section>` with `<h2>` and descriptive bullet list; visually emphasized info banner.
- Handled interactions: none.
- Handled validation: none.
- Types: `PoCScopeNoticeProps`.
- Props:
  - `limitations: string[]` (e.g., ["Single predefined store", "Cats/Dogs only", "No guest access"])
  - `disclaimer: string`
  - `privacyNote: string`

### PrimaryCTAButtons
- Component description: Primary call-to-action buttons for Login and Register.
- Main elements: `<nav>` with two buttons/links styled as primary and secondary actions.
- Handled interactions:
  - `onLoginClick()`: navigate to `loginPath`.
  - `onRegisterClick()`: navigate to `registerPath`.
- Handled validation: none (navigation only). Ensure keyboard activation via Enter/Space and proper focus ring.
- Types: `PrimaryCTAButtonsProps`, `AuthRoutesConfig`.
- Props:
  - `loginPath: string`
  - `registerPath: string`
  - `onLogin?: () => void`
  - `onRegister?: () => void`

### FooterLinks
- Component description: Footer with Privacy and Terms links.
- Main elements: `<footer>` with a `<nav>`, list of links.
- Handled interactions: link clicks.
- Handled validation: ensure `rel` and `target` attributes are secure when pointing to external URLs.
- Types: `FooterLinksProps`, `FooterLink`.
- Props:
  - `links: FooterLink[]` (e.g., [{ label: "Privacy", href: "/privacy" }, { label: "Terms", href: "/terms" }])

## 5. Types
Define TypeScript interfaces for props and view models used by the Landing view.

```ts
// View-level config
export interface AuthRoutesConfig {
  login: string;   // e.g., "/login"
  register: string; // e.g., "/register"
}

// MarketingHero
export interface MarketingHeroProps {
  headline: string;
  subheadline: string;
  illustrationSrc?: string;
  illustrationAlt?: string;
}

// HowItWorks
export interface HowStep {
  id: string;
  title: string;
  description: string;
  icon?: string; // name of icon or path
}

export interface HowItWorksProps {
  steps: HowStep[];
}

// PoCScopeNotice
export interface PoCScopeNoticeProps {
  limitations: string[];
  disclaimer: string;
  privacyNote: string;
}

// CTA Buttons
export interface PrimaryCTAButtonsProps {
  loginPath: string;
  registerPath: string;
  onLogin?: () => void;
  onRegister?: () => void;
}

// Footer
export interface FooterLink {
  label: string;
  href: string;
  external?: boolean;
  rel?: string; // e.g., "noopener noreferrer"
  target?: string; // e.g., "_blank"
}

export interface FooterLinksProps {
  links: FooterLink[];
}

// Optional: LandingView composition props (if content is CMS-driven)
export interface LandingViewProps {
  hero: MarketingHeroProps;
  steps: HowStep[];
  scope: PoCScopeNoticeProps;
  authRoutes: AuthRoutesConfig;
  footerLinks: FooterLink[];
}
```

## 6. State Management
- The Landing view is predominantly static; no server state is needed.
- Optional derived state:
  - `isAuthenticated: boolean` (from a global auth store or `useAuth` hook). If true, redirect to `/analyze`.
  - `prefersReducedMotion: boolean` (read once from `window.matchMedia('(prefers-reduced-motion: reduce)')`) to reduce hero animations.
- No custom hook is required beyond a standard `useAuth()` used app-wide (if available). Otherwise, the page does not manage state.

## 7. API Integration
- The Landing view does not call APIs directly. It provides navigation to Login and Register.
- For reference, the authentication endpoints (consumed by dedicated auth views) accept/return these shapes:

Request: `POST /api/auth/register`
```ts
interface RegisterDto {
  email: string;       // required, valid email
  password: string;    // required, min length 8
}
```
Response: `201 Created` with body
```ts
interface AuthResponseDto {
  userId: string;
  token: string;       // JWT
}
```

Request: `POST /api/auth/login`
```ts
interface LoginRequestDto {
  email: string;    // required, valid email
  password: string; // required
}
```
Response: `200 OK` with body
```ts
type AuthResponseDto = {
  userId: string;
  token: string;
}
```
Errors: `401 Unauthorized` (login), `409 Conflict` (register), `400 Bad Request` (validation). The Landing page must not surface auth errors; those belong to auth views.

## 8. User Interactions
- **Click Register**: Navigates to `registerPath`.
- **Click Login**: Navigates to `loginPath`.
- **Keyboard navigation**: Tabbing order reaches hero → how it works → scope notice → CTAs → footer. Enter/Space activates buttons/links.
- **Skip to main** (optional global): A visually hidden skip link navigates to main content region.

## 9. Conditions and Validation
- **No authenticated data**: Do not fetch or render user-specific content.
- **Optional redirect if authenticated**: If `isAuthenticated` is true, immediately redirect to analysis route (`/analyze`).
- **Content presence**: Ensure required copy is present: purpose statement, PoC limitations, privacy note, AI disclaimer, CTAs, and footer links.
- **Accessibility checks**: Headings in semantic order, links have accessible names, images include `alt`, buttons have discernible text, focus styles visible.

## 10. Error Handling
- Navigation failures are rare; provide anchor `<a href>` fallback where possible for progressive enhancement.
- External links: use `rel="noopener noreferrer"` with `target="_blank"` to prevent reverse tabnabbing.
- If optional auth redirect logic throws (e.g., bad token parsing), catch and continue rendering the Landing without personalization.

## 11. Implementation Steps
1. Add route for `/` that renders `LandingView`.
2. Create `MarketingHero` with `<header>`, `<h1>`, `<p>`, optional illustration; style with Tailwind.
3. Create `HowItWorks` that renders three `HowStep` items in an `<ol>` with icons and copy.
4. Create `PoCScopeNotice` with a highlighted info panel listing limitations, AI disclaimer, and privacy note.
5. Create `PrimaryCTAButtons` with primary Register and secondary Login actions; wire to router navigation using `loginPath` and `registerPath` props.
6. Create `FooterLinks` showing Privacy/Terms; ensure external link security attributes when applicable.
7. Compose the page in `LandingView`: hero → how-it-works → scope notice → CTAs → footer.
8. Optional: read `isAuthenticated` from a global store or `useAuth`; if true, redirect to `/analyze`.
9. Accessibility pass: check heading structure, tab order, focus rings, color contrast, and `prefers-reduced-motion` handling.
10. Write lightweight tests (if test setup exists): render smoke test, CTA navigation test, authenticated redirect behavior.


