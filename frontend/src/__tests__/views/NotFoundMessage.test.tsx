import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import NotFoundMessage from '../../views/not-found/components/NotFoundMessage'

describe('NotFoundMessage', () => {
  it('renders title and description correctly', () => {
    render(
      <NotFoundMessage
        title="Page Not Found"
        description="The page you are looking for does not exist."
      />
    )

    expect(screen.getByRole('heading', { name: 'Page Not Found' })).toBeInTheDocument()
    expect(screen.getByText('The page you are looking for does not exist.')).toBeInTheDocument()
  })

  it('renders optional detail message when provided', () => {
    render(
      <NotFoundMessage
        title="Page Not Found"
        description="Main description"
        detail="Additional detail about the error"
      />
    )

    expect(screen.getByText('Additional detail about the error')).toBeInTheDocument()
  })

  it('does not render detail section when detail is not provided', () => {
    const { container } = render(
      <NotFoundMessage
        title="Page Not Found"
        description="Main description"
      />
    )

    // Should only have 2 paragraphs (description only, no detail)
    const paragraphs = container.querySelectorAll('p')
    expect(paragraphs).toHaveLength(1)
  })

  it('falls back to default title when empty string provided', () => {
    render(
      <NotFoundMessage
        title=""
        description="Some description"
      />
    )

    expect(screen.getByRole('heading', { name: 'Page Not Found' })).toBeInTheDocument()
  })

  it('falls back to default description when empty string provided', () => {
    render(
      <NotFoundMessage
        title="Custom Title"
        description=""
      />
    )

    expect(
      screen.getByText('The page you are looking for does not exist or has been moved.')
    ).toBeInTheDocument()
  })

  it('truncates title longer than 120 characters', () => {
    const longTitle = 'A'.repeat(150)
    render(
      <NotFoundMessage
        title={longTitle}
        description="Description"
      />
    )

    const heading = screen.getByRole('heading')
    expect(heading.textContent).toHaveLength(120) // 117 chars + '...'
    expect(heading.textContent?.endsWith('...')).toBe(true)
  })

  it('does not render detail when only whitespace is provided', () => {
    const { container } = render(
      <NotFoundMessage
        title="Title"
        description="Description"
        detail="   "
      />
    )

    const paragraphs = container.querySelectorAll('p')
    expect(paragraphs).toHaveLength(1) // Only description paragraph
  })

  it('has correct accessibility attributes', () => {
    render(
      <NotFoundMessage
        title="Page Not Found"
        description="Description"
      />
    )

    const heading = screen.getByRole('heading')
    expect(heading).toHaveAttribute('id', 'not-found-title')
    expect(heading).toHaveAttribute('tabIndex', '-1')
  })

  it('can receive and forward ref correctly', () => {
    const ref = { current: null as HTMLHeadingElement | null }
    render(
      <NotFoundMessage
        ref={ref as React.RefObject<HTMLHeadingElement>}
        title="Title"
        description="Description"
      />
    )

    expect(ref.current).toBeInstanceOf(HTMLHeadingElement)
  })
})

