export interface AuthRoutesConfig {
  login: string
  register: string
}

export interface MarketingHeroProps {
  headline: string
  subheadline: string
  illustrationSrc?: string
  illustrationAlt?: string
  prefersReducedMotion?: boolean
}

export interface HowStep {
  id: string
  title: string
  description: string
  icon?: string
}

export interface HowItWorksProps {
  steps: HowStep[]
}

export interface PoCScopeNoticeProps {
  limitations: string[]
  disclaimer: string
  privacyNote: string
}

export interface PrimaryCTAButtonsProps {
  loginPath: string
  registerPath: string
  onLogin?: () => void
  onRegister?: () => void
}

export interface FooterLink {
  label: string
  href: string
  external?: boolean
  rel?: string
  target?: string
}

export interface FooterLinksProps {
  links: FooterLink[]
}

export interface LandingViewProps {
  hero: MarketingHeroProps
  steps: HowStep[]
  scope: PoCScopeNoticeProps
  authRoutes: AuthRoutesConfig
  footerLinks?: FooterLink[]
}

