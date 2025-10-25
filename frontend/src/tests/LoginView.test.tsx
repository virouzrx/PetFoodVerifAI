import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import LoginView from '../views/login/LoginView'
import useLogin from '../hooks/useLogin'

vi.mock('../hooks/useLogin')

const renderWithRouter = () =>
  render(
    <MemoryRouter>
      <LoginView />
    </MemoryRouter>,
  )

describe('LoginView', () => {
  const loginMock = vi.fn()
  const clearErrorMock = vi.fn()

  beforeEach(() => {
    loginMock.mockReset()
    clearErrorMock.mockReset()
    ;(useLogin as unknown as vi.Mock).mockReturnValue({
      login: loginMock,
      isLoading: false,
      error: {},
      clearError: clearErrorMock,
    })
  })

  it('validates email and password fields on submit', async () => {
    renderWithRouter()

    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    expect(await screen.findByText('Email is required.')).toBeInTheDocument()
    expect(screen.getByText('Password is required.')).toBeInTheDocument()
    expect(loginMock).not.toHaveBeenCalled()
  })

  it('submits valid credentials and redirects', async () => {
    ;(useLogin as unknown as vi.Mock).mockReturnValue({
      login: loginMock.mockResolvedValue(undefined),
      isLoading: false,
      error: {},
      clearError: clearErrorMock,
    })

    renderWithRouter()

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'user@test.com' } })
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password1' } })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => expect(loginMock).toHaveBeenCalledWith({
      email: 'user@test.com',
      password: 'password1',
    }))
  })

  it('shows server form error in GlobalAlert', async () => {
    ;(useLogin as unknown as vi.Mock).mockReturnValue({
      login: loginMock,
      isLoading: false,
      error: { form: 'We couldn’t sign you in. Check your credentials and try again.' },
      clearError: clearErrorMock,
    })

    renderWithRouter()

    expect(
      screen.getByRole('alert', {
        name: /we couldn’t sign you in\. check your credentials and try again\./i,
      }),
    ).toBeInTheDocument()
  })
})

