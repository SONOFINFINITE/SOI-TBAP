import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, it, expect, beforeAll, afterEach, afterAll, vi } from 'vitest'
import { server } from '@/test/mocks/server'
import { TimerFormPage } from '@/pages/TimerFormPage'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => {
  server.resetHandlers()
  mockNavigate.mockReset()
})
afterAll(() => server.close())

function renderTimerForm(path = '/timers/new') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/timers/new" element={<TimerFormPage />} />
        <Route path="/timers/:id/edit" element={<TimerFormPage />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('TimerFormPage - Create', () => {
  it('renders create form', () => {
    renderTimerForm()
    expect(screen.getByText('Новый таймер')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('tg_promo')).toBeInTheDocument()
  })

  it('validates required fields', async () => {
    const user = userEvent.setup()
    renderTimerForm()

    await user.click(screen.getByText('Сохранить'))

    await waitFor(() => {
      expect(screen.getByText('Укажите имя таймера')).toBeInTheDocument()
    })
    expect(screen.getByText('Укажите текст сообщения')).toBeInTheDocument()
  })

  it('creates timer successfully', async () => {
    const user = userEvent.setup()
    renderTimerForm()

    await user.type(screen.getByPlaceholderText('tg_promo'), 'new_timer')
    await user.type(
      screen.getByPlaceholderText('Подпишись на телегу t.me/...'),
      'Тест'
    )
    await user.click(screen.getByText('Сохранить'))

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true })
    })
  })

  it('cancel navigates back', async () => {
    const user = userEvent.setup()
    renderTimerForm()

    await user.click(screen.getByText('Отмена'))

    expect(mockNavigate).toHaveBeenCalledWith(-1)
  })
})

describe('TimerFormPage - Edit', () => {
  it('loads existing timer data', async () => {
    renderTimerForm('/timers/1/edit')

    await waitFor(() => {
      expect(screen.getByText('Редактировать таймер')).toBeInTheDocument()
    })

    await waitFor(() => {
      expect(screen.getByDisplayValue('tg_promo')).toBeInTheDocument()
    })

    expect(
      screen.getByDisplayValue('Подпишись на телегу t.me/cbicran')
    ).toBeInTheDocument()
  })

  it('shows error for non-existent timer', async () => {
    renderTimerForm('/timers/999/edit')

    await waitFor(() => {
      expect(screen.getByText('Таймер не найден')).toBeInTheDocument()
    })
  })
})
