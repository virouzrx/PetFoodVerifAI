import type { FooterLinksProps } from '../../types/landing'

const FooterLinks = ({ links }: FooterLinksProps) => {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 px-6 py-8 text-sm text-slate-500 sm:flex-row sm:justify-between">
        <p>&copy; {new Date().getFullYear()} PetFoodVerifAI.</p>
        <nav aria-label="Legal links" className="flex items-center gap-6">
          {links.map((link) => {
            const rel = link.external
              ? link.rel ?? 'noopener noreferrer'
              : link.rel
            const target = link.external ? link.target ?? '_blank' : link.target

            return (
              <a
                className="hover:text-brand-primary"
                href={link.href}
                key={link.href}
                rel={rel}
                target={target}
              >
                {link.label}
              </a>
            )
          })}
        </nav>
      </div>
    </footer>
  )
}

export default FooterLinks

