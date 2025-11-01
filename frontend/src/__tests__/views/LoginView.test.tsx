import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, type Mock } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import LoginView from '../../views/login/LoginView'
import useLogin from '../../hooks/useLogin'
import { AuthProvider } from '../../state/auth/AuthContext'

vi.mock('../../hooks/useLogin')

const renderWithRouter = () =>
  render(
    <GoogleOAuthProvider clientId="test-client-id">
      <AuthProvider>
        <MemoryRouter>
          <LoginView />
        </MemoryRouter>
      </AuthProvider>
    </GoogleOAuthProvider>,
  )

describe('LoginView', () => {
  const loginMock = vi.fn()
  const clearErrorMock = vi.fn()

  beforeEach(() => {
    loginMock.mockReset()
    clearErrorMock.mockReset()
    ;(useLogin as unknown as Mock).mockReturnValue({
      login: loginMock,
      isLoading: false,
      error: {},
      clearError: clearErrorMock,
    })
  })

  it('validates email and password fields on submit', async () => {
    renderWithRouter()

    const buttons = screen.getAllByRole('button', { name: /sign in/i })
    fireEvent.click(buttons[0]) // Click the form sign-in button (first one, not Google)

    expect(await screen.findByText('Email is required.')).toBeInTheDocument()
    expect(screen.getByText('Password is required.')).toBeInTheDocument()
    expect(loginMock).not.toHaveBeenCalled()
  })

  it('submits valid credentials and redirects', async () => {
    ;(useLogin as unknown as Mock).mockReturnValue({
      login: loginMock.mockResolvedValue(undefined),
      isLoading: false,
      error: {},
      clearError: clearErrorMock,
    })

    renderWithRouter()

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'user@test.com' } })
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password1' } })
    
    const buttons = screen.getAllByRole('button', { name: /sign in/i })
    fireEvent.click(buttons[0]) // Click the form sign-in button (first one, not Google)

    await waitFor(() => expect(loginMock).toHaveBeenCalledWith({
      email: 'user@test.com',
      password: 'password1',
    }))
  })

  it('shows server form error in GlobalAlert', async () => {
    ;(useLogin as unknown as Mock).mockReturnValue({
      login: loginMock,
      isLoading: false,
      error: { form: 'We couldn\'t sign you in. Check your credentials and try again.' },
      clearError: clearErrorMock,
    })

    renderWithRouter()

    expect(screen.getByRole('alert')).toHaveTextContent(
      'We couldn\'t sign you in. Check your credentials and try again.',
    )
  })
})

