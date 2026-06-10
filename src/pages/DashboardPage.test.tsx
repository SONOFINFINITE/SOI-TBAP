import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, beforeAll, afterEach, afterAll, vi, beforeEach } from 'vitest'
import { server } from '@/test/mocks/server'
import { DashboardPage } from '@/pages/DashboardPage'
import { useAuthStore } from '@/store/auth'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
beforeEach(() => {
  useAuthStore.getState().setAuth('test-token', { id: 1, username: 'i_cbic_i' })
})
afterEach(() => {
  server.resetHandlers()
  mockNavigate.mockReset()
  useAuthStore.getState().logout()
})
afterAll(() => server.close())

function renderDashboard() {
  return render(
    <MemoryRouter>
      <DashboardPage />
    </MemoryRouter>
  )
}

describe('DashboardPage', () => {
  it('shows loading initially', () => {
    renderDashboard()
    expect(document.querySelector('.animate-spin')).toBeInTheDocument()
  })

  it('renders stats cards after loading', async () => {
    renderDashboard()
    await waitFor(() => {
      expect(screen.getByText('tsuesiro_bot')).toBeInTheDocument()
    })
    expect(screen.getByText('Оффлайн')).toBeInTheDocument()
  })

  it('renders commands list', async () => {
    renderDashboard()
    await waitFor(() => {
      expect(screen.getByText('!вк')).toBeInTheDocument()
    })
    expect(screen.getByText('!сыс')).toBeInTheDocument()
  })

  it('switches to timers tab', async () => {
    const user = userEvent.setup()
    renderDashboard()

    await waitFor(() => {
      expect(screen.getByText('!вк')).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /Таймеры/i }))

    await waitFor(() => {
      expect(screen.getByText('tg_promo')).toBeInTheDocument()
    })
    expect(screen.getByText('donate')).toBeInTheDocument()
  })

  it('search filters commands', async () => {
    const user = userEvent.setup()
    renderDashboard()

    await waitFor(() => {
      expect(screen.getByText('!вк')).toBeInTheDocument()
    })

    await user.type(screen.getByPlaceholderText('Поиск...'), 'сыс')

    expect(screen.getByText('!сыс')).toBeInTheDocument()
    expect(screen.queryByText('!вк')).not.toBeInTheDocument()
  })

  it('navigates to create command', async () => {
    const user = userEvent.setup()
    renderDashboard()

    await waitFor(() => {
      expect(screen.getByText('!вк')).toBeInTheDocument()
    })

    await user.click(screen.getByText('Создать'))
    expect(mockNavigate).toHaveBeenCalledWith('/commands/new')
  })

  it('displays username in header', async () => {
    renderDashboard()
    await waitFor(() => {
      expect(screen.getByText('i_cbic_i')).toBeInTheDocument()
    })
  })

  it('logout clears auth and navigates', async () => {
    const user = userEvent.setup()
    renderDashboard()

    await waitFor(() => {
      expect(screen.getByText('i_cbic_i')).toBeInTheDocument()
    })

    await user.click(screen.getByTitle('Выйти'))

    expect(useAuthStore.getState().isAuthenticated).toBe(false)
    expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true })
  })
})
