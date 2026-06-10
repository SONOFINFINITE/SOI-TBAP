import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, beforeAll, afterEach, afterAll, vi } from 'vitest'
import { server } from '@/test/mocks/server'
import { LoginPage } from '@/pages/LoginPage'
import { useAuthStore } from '@/store/auth'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => {
  server.resetHandlers()
  mockNavigate.mockReset()
  useAuthStore.getState().logout()
})
afterAll(() => server.close())

function renderLogin() {
  return render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>
  )
}

describe('LoginPage', () => {
  it('renders login form', () => {
    renderLogin()
    expect(screen.getByLabelText('Логин')).toBeInTheDocument()
    expect(screen.getByLabelText('Пароль')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /войти/i })).toBeInTheDocument()
  })

  it('button is disabled when fields are empty', () => {
    renderLogin()
    expect(screen.getByRole('button', { name: /войти/i })).toBeDisabled()
  })

  it('enables button when fields are filled', async () => {
    const user = userEvent.setup()
    renderLogin()

    await user.type(screen.getByLabelText('Логин'), 'admin')
    await user.type(screen.getByLabelText('Пароль'), 'pass')

    expect(screen.getByRole('button', { name: /войти/i })).toBeEnabled()
  })

  it('shows error on wrong credentials', async () => {
    const user = userEvent.setup()
    renderLogin()

    await user.type(screen.getByLabelText('Логин'), 'wrong')
    await user.type(screen.getByLabelText('Пароль'), 'wrong')
    await user.click(screen.getByRole('button', { name: /войти/i }))

    await waitFor(() => {
      expect(screen.getByText('Неверный логин или пароль')).toBeInTheDocument()
    })
  })

  it('navigates on successful login', async () => {
    const user = userEvent.setup()
    renderLogin()

    await user.type(screen.getByLabelText('Логин'), 'i_cbic_i')
    await user.type(screen.getByLabelText('Пароль'), 'correct_password')
    await user.click(screen.getByRole('button', { name: /войти/i }))

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true })
    })

    expect(useAuthStore.getState().isAuthenticated).toBe(true)
    expect(useAuthStore.getState().token).toBe('mock-jwt-token-123')
  })

  it('toggles password visibility', async () => {
    const user = userEvent.setup()
    renderLogin()

    const passwordInput = screen.getByLabelText('Пароль')
    expect(passwordInput).toHaveAttribute('type', 'password')

    const toggleBtn = screen.getByLabelText('Показать пароль')
    await user.click(toggleBtn)

    expect(passwordInput).toHaveAttribute('type', 'text')
  })
})
