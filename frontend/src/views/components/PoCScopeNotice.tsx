import type { PoCScopeNoticeProps } from '../../types/landing'

const PoCScopeNotice = ({ limitations, disclaimer, privacyNote }: PoCScopeNoticeProps) => {
  return (
    <section
      aria-labelledby="poc-scope-heading"
      className="rounded-3xl border-2 border-brand-primary bg-brand-tertiary/30 p-8 text-left shadow-md"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <h2 className="text-2xl font-semibold text-brand-primary" id="poc-scope-heading">
          Proof of Concept Scope
        </h2>
        <p className="max-w-md text-sm text-brand-dark">
          This PoC has limited coverage while we validate the experience. Review the constraints before
          proceeding to the analysis tool.
        </p>
      </div>

      <ul className="mt-6 list-disc space-y-3 pl-6 text-gray-700" role="list">
        {limitations.map((limitation) => (
          <li key={limitation}>{limitation}</li>
        ))}
      </ul>

      <div className="mt-6 space-y-3 rounded-2xl border-2 border-brand-primary bg-brand-secondary p-6 text-sm text-gray-700 shadow-sm">
        <p>
          <span className="font-semibold text-brand-accent">AI Disclaimer:</span> {disclaimer}
        </p>
        <p>
          <span className="font-semibold text-brand-accent">Privacy Notice:</span> {privacyNote}
        </p>
      </div>
    </section>
  )
}

export default PoCScopeNotice

