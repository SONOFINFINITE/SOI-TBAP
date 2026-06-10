import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, it, expect, beforeAll, afterEach, afterAll, vi } from 'vitest'
import { server } from '@/test/mocks/server'
import { CommandFormPage } from '@/pages/CommandFormPage'

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

function renderCommandForm(path = '/commands/new') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/commands/new" element={<CommandFormPage />} />
        <Route path="/commands/:id/edit" element={<CommandFormPage />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('CommandFormPage - Create', () => {
  it('renders create form', () => {
    renderCommandForm()
    expect(screen.getByText('Новая команда')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('!команда')).toBeInTheDocument()
  })

  it('validates required fields', async () => {
    const user = userEvent.setup()
    renderCommandForm()

    await user.click(screen.getByText('Сохранить'))

    await waitFor(() => {
      expect(screen.getByText('Укажите триггер')).toBeInTheDocument()
    })
    expect(screen.getByText('Укажите шаблон ответа')).toBeInTheDocument()
  })

  it('validates trigger format', async () => {
    const user = userEvent.setup()
    renderCommandForm()

    await user.type(screen.getByPlaceholderText('!команда'), 'команда')
    await user.type(screen.getByPlaceholderText('@{user}, текст ответа'), 'ответ')
    await user.click(screen.getByText('Сохранить'))

    await waitFor(() => {
      expect(screen.getByText('Триггер должен начинаться с !')).toBeInTheDocument()
    })
  })

  it('creates command successfully', async () => {
    const user = userEvent.setup()
    renderCommandForm()

    await user.type(screen.getByPlaceholderText('!команда'), '!новая')
    await user.type(screen.getByPlaceholderText('@{user}, текст ответа'), 'Привет, @{user}')
    await user.click(screen.getByText('Сохранить'))

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true })
    })
  })

  it('shows variant fields for random_reply type', async () => {
    const user = userEvent.setup()
    renderCommandForm()

    await user.selectOptions(
      screen.getByDisplayValue('Простая'),
      'random_reply'
    )

    expect(screen.getByText('Варианты')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Вариант 1')).toBeInTheDocument()
  })

  it('validates variants are required for random_reply', async () => {
    const user = userEvent.setup()
    renderCommandForm()

    await user.type(screen.getByPlaceholderText('!команда'), '!тест')
    await user.type(screen.getByPlaceholderText('@{user}, текст ответа'), 'ответ{variant}')

    await user.selectOptions(
      screen.getByDisplayValue('Простая'),
      'random_reply'
    )

    await user.click(screen.getByText('Сохранить'))

    await waitFor(() => {
      expect(screen.getByText('Добавьте хотя бы один вариант')).toBeInTheDocument()
    })
  })

  it('shows range fields for random_range type', async () => {
    const user = userEvent.setup()
    renderCommandForm()

    await user.selectOptions(
      screen.getByDisplayValue('Простая'),
      'random_range'
    )

    expect(screen.getByText('Min')).toBeInTheDocument()
    expect(screen.getByText('Max')).toBeInTheDocument()
  })

  it('cancel navigates back', async () => {
    const user = userEvent.setup()
    renderCommandForm()

    await user.click(screen.getByText('Отмена'))

    expect(mockNavigate).toHaveBeenCalledWith(-1)
  })
})

describe('CommandFormPage - Edit', () => {
  it('loads existing command data', async () => {
    renderCommandForm('/commands/1/edit')

    await waitFor(() => {
      expect(screen.getByText('Редактировать команду')).toBeInTheDocument()
    })

    await waitFor(() => {
      expect(screen.getByDisplayValue('!вк')).toBeInTheDocument()
    })

    expect(
      screen.getByDisplayValue('@{user}, Паблик - https://vk.com/sys_vtube')
    ).toBeInTheDocument()
  })

  it('shows error for non-existent command', async () => {
    renderCommandForm('/commands/999/edit')

    await waitFor(() => {
      expect(screen.getByText('Команда не найдена')).toBeInTheDocument()
    })
  })
})
