import { useEffect, useRef } from 'react'
import { useNotFoundViewModel } from './hooks/useNotFoundViewModel'
import NotFoundMessage from './components/NotFoundMessage'
import PrimaryLinks from './components/PrimaryLinks'
import BackLink from './components/BackLink'

/**
 * NotFoundRoute
 * Top-level route component for the 404 Not Found page.
 * Composes layout, builds view model, and passes data to child presentation components.
 * Handles focus management for accessibility and optional analytics dispatch.
 */
const NotFoundRoute = () => {
  const viewModel = useNotFoundViewModel()
  const headingRef = useRef<HTMLHeadingElement>(null)

  // Set document title and move focus to heading for accessibility
  useEffect(() => {
    document.title = 'Page Not Found | PetFoodVerifAI'

    // Focus the heading for screen readers and keyboard users
    if (headingRef.current) {
      headingRef.current.focus()
    }

    // Optional: Log missing path for telemetry (placeholder for analytics)
    if (process.env.NODE_ENV === 'development') {
      console.info('[NotFoundRoute] User landed on 404', {
        fromPath: viewModel.fromPath,
        currentPath: window.location.pathname,
      })
    }
  }, [viewModel.fromPath])

  return (
    <div className="flex min-h-screen flex-col bg-brand-tertiary">
      <main role="main" className="flex flex-1 items-center justify-center px-4 py-12">
        <section className="w-full max-w-2xl">
          <div className="rounded-lg bg-brand-secondary p-8 shadow-lg md:p-12">
            {/* Main message */}
            <NotFoundMessage
              ref={headingRef}
              title={viewModel.title}
              description={viewModel.description}
              detail={viewModel.detail}
            />

            {/* Primary navigation links */}
            <div className="mt-8">
              <PrimaryLinks links={viewModel.links} />
            </div>

            {/* Optional back link */}
            {viewModel.fromPath && (
              <div className="mt-6">
                <BackLink fromPath={viewModel.fromPath} fallbackTo="/analyze" label={viewModel.backLabel} />
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}

export default NotFoundRoute

