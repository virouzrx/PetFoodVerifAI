type SubmitButtonProps = {
  isSubmitting: boolean
  label?: string
  loadingLabel?: string
}

const SubmitButton = ({
  isSubmitting,
  label = 'Create account',
  loadingLabel = 'Creating account...',
}: SubmitButtonProps) => {
  return (
    <button
      type="submit"
      className="flex w-full items-center justify-center gap-2 rounded-md bg-brand-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary disabled:cursor-not-allowed disabled:bg-brand-primary/60"
      disabled={isSubmitting}
      aria-disabled={isSubmitting}
      aria-busy={isSubmitting}
    >
      {isSubmitting ? (
        <>
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          {loadingLabel}
        </>
      ) : (
        label
      )}
    </button>
  )
}

export default SubmitButton

