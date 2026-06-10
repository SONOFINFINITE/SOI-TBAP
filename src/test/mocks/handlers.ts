import { http, HttpResponse } from 'msw'
import type { Command, TimerCommand, BotStats, LoginResponse } from '@/types/api'

const BASE = 'https://soi-tsuesiro-render.onrender.com'

export const mockCommands: Command[] = [
  {
    id: 1,
    trigger: '!вк',
    type: 'simple',
    response: '@{user}, Паблик - https://vk.com/sys_vtube',
    variants: null,
    enabled: 1,
    created_at: '2025-01-15 12:00:00',
    updated_at: '2025-01-15 12:00:00',
  },
  {
    id: 2,
    trigger: '!сыс',
    type: 'random_reply',
    response: 'Поздравляю, @{user}, сегодня ты - {variant}!',
    variants: ['Довольная СыСя', 'Злая СыС'],
    enabled: 1,
    created_at: '2025-01-16 10:00:00',
    updated_at: '2025-01-16 10:00:00',
  },
  {
    id: 3,
    trigger: '!тест',
    type: 'simple',
    response: 'Тестовый ответ',
    variants: null,
    enabled: 0,
    created_at: '2025-01-17 10:00:00',
    updated_at: '2025-01-17 10:00:00',
  },
]

export const mockTimers: TimerCommand[] = [
  {
    id: 1,
    name: 'tg_promo',
    message: 'Подпишись на телегу t.me/cbicran',
    interval_minutes: 25,
    enabled: 1,
    created_at: '2025-01-15 12:00:00',
    updated_at: '2025-01-15 12:00:00',
  },
  {
    id: 2,
    name: 'donate',
    message: 'Ссылки на донат в описании!',
    interval_minutes: 60,
    enabled: 0,
    created_at: '2025-01-16 10:00:00',
    updated_at: '2025-01-16 10:00:00',
  },
]

export const mockStats: BotStats = {
  status: 'running',
  channel: 'I_CbIC_I',
  botUsername: 'tsuesiro_bot',
  uptime: 12345.678,
  timestamp: '2025-06-10T12:00:00Z',
  stream: 'offline',
  activeTimers: 0,
}

export const mockLoginResponse: LoginResponse = {
  token: 'mock-jwt-token-123',
  admin: { id: 1, username: 'i_cbic_i' },
}

export const handlers = [
  // Auth
  http.post(`${BASE}/api/auth/login`, async ({ request }) => {
    const body = (await request.json()) as { username?: string; password?: string }
    if (!body.username || !body.password) {
      return HttpResponse.json({ error: 'Укажите username и password' }, { status: 400 })
    }
    if (body.username === 'i_cbic_i' && body.password === 'correct_password') {
      return HttpResponse.json(mockLoginResponse)
    }
    return HttpResponse.json({ error: 'Неверный логин или пароль' }, { status: 401 })
  }),

  http.get(`${BASE}/api/auth/me`, () => {
    return HttpResponse.json({ id: 1, username: 'i_cbic_i' })
  }),

  // Stats
  http.get(`${BASE}/stats`, () => {
    return HttpResponse.json(mockStats)
  }),

  // Commands
  http.get(`${BASE}/api/commands`, () => {
    return HttpResponse.json(mockCommands)
  }),

  http.get(`${BASE}/api/commands/types`, () => {
    return HttpResponse.json([
      'simple',
      'random_reply',
      'random_target',
      'random_target_action',
      'random_percent_target',
      'random_range',
    ])
  }),

  http.get(`${BASE}/api/commands/:id`, ({ params }) => {
    const cmd = mockCommands.find((c) => c.id === Number(params.id))
    if (!cmd) return HttpResponse.json({ error: 'Команда не найдена' }, { status: 404 })
    return HttpResponse.json(cmd)
  }),

  http.post(`${BASE}/api/commands`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>
    const newCommand: Command = {
      id: 100,
      trigger: body.trigger as string,
      type: (body.type as Command['type']) || 'simple',
      response: body.response as string,
      variants: (body.variants as Command['variants']) ?? null,
      enabled: body.enabled === false ? 0 : 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    return HttpResponse.json(newCommand, { status: 201 })
  }),

  http.put(`${BASE}/api/commands/:id`, async ({ params, request }) => {
    const cmd = mockCommands.find((c) => c.id === Number(params.id))
    if (!cmd) return HttpResponse.json({ error: 'Команда не найдена' }, { status: 404 })
    const body = (await request.json()) as Record<string, unknown>
    return HttpResponse.json({
      ...cmd,
      ...body,
      enabled: body.enabled !== undefined ? (body.enabled ? 1 : 0) : cmd.enabled,
      updated_at: new Date().toISOString(),
    })
  }),

  http.delete(`${BASE}/api/commands/:id`, ({ params }) => {
    const cmd = mockCommands.find((c) => c.id === Number(params.id))
    if (!cmd) return HttpResponse.json({ error: 'Команда не найдена' }, { status: 404 })
    return new HttpResponse(null, { status: 204 })
  }),

  // Timer Commands
  http.get(`${BASE}/api/timer-commands`, () => {
    return HttpResponse.json(mockTimers)
  }),

  http.get(`${BASE}/api/timer-commands/:id`, ({ params }) => {
    const timer = mockTimers.find((t) => t.id === Number(params.id))
    if (!timer) return HttpResponse.json({ error: 'Таймер не найден' }, { status: 404 })
    return HttpResponse.json(timer)
  }),

  http.post(`${BASE}/api/timer-commands`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>
    const newTimer: TimerCommand = {
      id: 100,
      name: body.name as string,
      message: body.message as string,
      interval_minutes: (body.interval_minutes as number) || 25,
      enabled: body.enabled === false ? 0 : 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    return HttpResponse.json(newTimer, { status: 201 })
  }),

  http.put(`${BASE}/api/timer-commands/:id`, async ({ params, request }) => {
    const timer = mockTimers.find((t) => t.id === Number(params.id))
    if (!timer) return HttpResponse.json({ error: 'Таймер не найден' }, { status: 404 })
    const body = (await request.json()) as Record<string, unknown>
    return HttpResponse.json({
      ...timer,
      ...body,
      enabled: body.enabled !== undefined ? (body.enabled ? 1 : 0) : timer.enabled,
      updated_at: new Date().toISOString(),
    })
  }),

  http.delete(`${BASE}/api/timer-commands/:id`, ({ params }) => {
    const timer = mockTimers.find((t) => t.id === Number(params.id))
    if (!timer) return HttpResponse.json({ error: 'Таймер не найден' }, { status: 404 })
    return new HttpResponse(null, { status: 204 })
  }),
]
