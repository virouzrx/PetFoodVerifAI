import type { PoCScopeNoticeProps } from '../../types/landing'

const PoCScopeNotice = ({ limitations, disclaimer, privacyNote }: PoCScopeNoticeProps) => {
  return (
    <section
      aria-labelledby="poc-scope-heading"
      className="rounded-3xl border border-brand-primary/20 bg-brand-primary/5 p-8 text-left"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <h2 className="text-2xl font-semibold text-brand-primary" id="poc-scope-heading">
          Proof of Concept Scope
        </h2>
        <p className="max-w-md text-sm text-brand-primary/80">
          This PoC has limited coverage while we validate the experience. Review the constraints before
          proceeding to the analysis tool.
        </p>
      </div>

      <ul className="mt-6 list-disc space-y-3 pl-6 text-slate-700" role="list">
        {limitations.map((limitation) => (
          <li key={limitation}>{limitation}</li>
        ))}
      </ul>

      <div className="mt-6 space-y-3 rounded-2xl border border-brand-primary/30 bg-white/90 p-6 text-sm text-slate-600 shadow-sm">
        <p>
          <span className="font-semibold text-brand-secondary">AI Disclaimer:</span> {disclaimer}
        </p>
        <p>
          <span className="font-semibold text-brand-secondary">Privacy Notice:</span> {privacyNote}
        </p>
      </div>
    </section>
  )
}

export default PoCScopeNotice

