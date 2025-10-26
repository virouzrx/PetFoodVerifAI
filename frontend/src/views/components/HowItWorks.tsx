import type { HowItWorksProps } from '../../types/landing'

const HowItWorks = ({ steps }: HowItWorksProps) => {
  return (
    <section
      aria-labelledby="how-it-works-heading"
      className="rounded-3xl border-2 border-brand-accent bg-brand-secondary p-10 shadow-md"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-semibold text-brand-dark" id="how-it-works-heading">
          How it works
        </h2>
        <p className="max-w-md text-sm text-brand-dark">
          Understand what information you provide and how PetFoodVerifAI evaluates the data to
          deliver useful insights.
        </p>
      </div>

      <ol className="mt-8 space-y-8" role="list">
        {steps.map((step, index) => (
          <li className="flex flex-col gap-4 text-left sm:flex-row" key={step.id}>
            <span className="flex h-12 w-12 flex-none items-center justify-center rounded-full bg-brand-primary text-lg font-bold text-white shadow-md">
              {index + 1}
            </span>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-brand-dark">{step.title}</h3>
              <p className="text-brand-dark">{step.description}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}

export default HowItWorks

