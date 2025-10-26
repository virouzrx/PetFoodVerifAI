export type NotFoundLink = {
  id: 'analyze' | 'products'
  label: string
  to: string
  icon?: React.ReactNode
  variant: 'primary' | 'secondary'
  requiresAuth?: boolean
}

export type NotFoundViewModel = {
  title: string
  description: string
  detail?: string
  links: NotFoundLink[]
  backLabel: string
  fromPath?: string | null
}

export type RouteErrorShape = {
  status?: number
  message?: string
  data?: unknown
}

