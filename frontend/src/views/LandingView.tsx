import { useMemo } from 'react'
import MarketingHero from './components/MarketingHero'
import HowItWorks from './components/HowItWorks'
import PoCScopeNotice from './components/PoCScopeNotice'
import PrimaryCTAButtons from './components/PrimaryCTAButtons'
import FooterLinks from './components/FooterLinks'
import type { HowStep, LandingViewProps } from '../types/landing'

const mockSteps: HowStep[] = [
  {
    id: 'step-collect',
    title: 'Share product URL and pet details',
    description:
      'Provide the supported store URL, pet type, and dietary notes so we can tailor the analysis.',
  },
  {
    id: 'step-ingredients',
    title: 'We gather ingredients or let you input manually',
    description:
      'We scrape ingredients when possible. If unavailable, you can input them manually for AI evaluation.',
  },
  {
    id: 'step-review',
    title: 'Receive AI recommendations and save history',
    description:
      'Review ingredient safety insights, suggested actions, and keep a record for your next visit.',
  },
]

const LandingView = () => {
  const viewModel: LandingViewProps = useMemo(
    () => ({
      hero: {
        headline: 'Verify pet food ingredients with confidence',
        subheadline:
          'PetFoodVerifAI helps you evaluate ingredients from supported stores for cats and dogs. Understand PoC limitations before exploring.',
      },
      steps: mockSteps,
      scope: {
        limitations: [
          'Supports a single predefined partner store for catalog lookups.',
          'Currently available for cat and dog food analysis only.',
          'Requires an authenticated account to run analyses.',
        ],
        disclaimer:
          'AI Disclaimer: This tool provides automated recommendations. Always consult a veterinarian for personalized guidance.',
        privacyNote:
          'Privacy Notice: Ingredient data you submit is used solely to generate insights and is not shared externally.',
      },
      authRoutes: {
        login: '/login',
        register: '/register',
      },
      footerLinks: [
        { label: 'Privacy', href: '/privacy' },
        { label: 'Terms', href: '/terms' },
      ],
    }),
    [],
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-secondary/20 via-brand-secondary/5 to-brand-accent/15">
      <MarketingHero {...viewModel.hero} />
      <main className="mx-auto flex max-w-5xl flex-col gap-12 px-6 pb-20">
        <HowItWorks steps={viewModel.steps} />
        <PoCScopeNotice {...viewModel.scope} />
        <PrimaryCTAButtons
          loginPath={viewModel.authRoutes.login}
          registerPath={viewModel.authRoutes.register}
        />
      </main>
      <FooterLinks links={viewModel.footerLinks} />
    </div>
  )
}

export default LandingView

