type SkipToContentLinkProps = {
  targetId?: string
}

const SkipToContentLink = ({ targetId = 'main-content' }: SkipToContentLinkProps) => {
  return (
    <a
      id="skip-to-content"
      href={`#${targetId}`}
      className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-brand-primary focus:px-4 focus:py-2 focus:text-white focus:shadow-md focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2"
    >
      Skip to main content
    </a>
  )
}

export default SkipToContentLink

