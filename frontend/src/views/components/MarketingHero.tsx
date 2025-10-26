import type { MarketingHeroProps } from '../../types/landing'

const MarketingHero = ({
  headline,
  subheadline,
  illustrationAlt,
  illustrationSrc,
  prefersReducedMotion,
}: MarketingHeroProps) => {
  return (
    <header className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-16 text-center sm:py-20">
      <div className="flex flex-col gap-3">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-accent sm:text-sm">
          Proof of Concept
        </span>
        <h1 className="text-4xl font-bold text-brand-dark sm:text-5xl lg:text-6xl">
          {headline}
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-gray-700 sm:text-xl">{subheadline}</p>
      </div>

      {illustrationSrc ? (
        <div className="mx-auto max-w-3xl overflow-hidden rounded-3xl bg-brand-secondary p-8 shadow-inner">
          <img
            alt={illustrationAlt ?? ''}
            className={prefersReducedMotion ? 'rounded-2xl object-cover' : 'rounded-2xl object-cover transition-transform duration-700 ease-out hover:scale-[1.03]'}
            loading="lazy"
            src={illustrationSrc}
          />
        </div>
      ) : null}
    </header>
  )
}

export default MarketingHero

