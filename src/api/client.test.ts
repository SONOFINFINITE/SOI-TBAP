import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest'
import { server } from '@/test/mocks/server'
import {
  login,
  getStats,
  getCommands,
  getCommand,
  createCommand,
  updateCommand,
  deleteCommand,
  getTimerCommands,
  getTimerCommand,
  createTimerCommand,
  updateTimerCommand,
  deleteTimerCommand,
  getCommandTypes,
} from '@/api/client'

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('API Client - Auth', () => {
  it('login with correct credentials', async () => {
    const result = await login({ username: 'i_cbic_i', password: 'correct_password' })
    expect(result.token).toBe('mock-jwt-token-123')
    expect(result.admin.username).toBe('i_cbic_i')
  })

  it('login with wrong credentials throws 401', async () => {
    await expect(login({ username: 'wrong', password: 'wrong' })).rejects.toThrow()
  })
})

describe('API Client - Stats', () => {
  it('getStats returns bot stats', async () => {
    const stats = await getStats()
    expect(stats.botUsername).toBe('tsuesiro_bot')
    expect(stats.channel).toBe('I_CbIC_I')
    expect(stats.stream).toBe('offline')
  })
})

describe('API Client - Commands', () => {
  it('getCommands returns command list', async () => {
    const commands = await getCommands()
    expect(commands).toHaveLength(3)
    expect(commands[0].trigger).toBe('!вк')
  })

  it('getCommand returns single command', async () => {
    const cmd = await getCommand(1)
    expect(cmd.id).toBe(1)
    expect(cmd.trigger).toBe('!вк')
    expect(cmd.type).toBe('simple')
  })

  it('getCommand with invalid id throws 404', async () => {
    await expect(getCommand(999)).rejects.toThrow()
  })

  it('getCommandTypes returns type list', async () => {
    const types = await getCommandTypes()
    expect(types).toContain('simple')
    expect(types).toContain('random_reply')
    expect(types).toHaveLength(6)
  })

  it('createCommand creates new command', async () => {
    const cmd = await createCommand({
      trigger: '!тест',
      response: 'Тест @{user}',
      type: 'simple',
    })
    expect(cmd.id).toBe(100)
    expect(cmd.trigger).toBe('!тест')
    expect(cmd.enabled).toBe(1)
  })

  it('updateCommand updates existing command', async () => {
    const cmd = await updateCommand(1, { response: 'Новый ответ' })
    expect(cmd.id).toBe(1)
    expect(cmd.response).toBe('Новый ответ')
  })

  it('deleteCommand succeeds', async () => {
    await expect(deleteCommand(1)).resolves.toBeUndefined()
  })
})

describe('API Client - Timer Commands', () => {
  it('getTimerCommands returns timer list', async () => {
    const timers = await getTimerCommands()
    expect(timers).toHaveLength(2)
    expect(timers[0].name).toBe('tg_promo')
  })

  it('getTimerCommand returns single timer', async () => {
    const timer = await getTimerCommand(1)
    expect(timer.id).toBe(1)
    expect(timer.interval_minutes).toBe(25)
  })

  it('createTimerCommand creates new timer', async () => {
    const timer = await createTimerCommand({
      name: 'new_timer',
      message: 'Тестовое сообщение',
      interval_minutes: 30,
    })
    expect(timer.id).toBe(100)
    expect(timer.name).toBe('new_timer')
  })

  it('updateTimerCommand updates existing timer', async () => {
    const timer = await updateTimerCommand(1, { interval_minutes: 45 })
    expect(timer.id).toBe(1)
    expect(timer.interval_minutes).toBe(45)
  })

  it('deleteTimerCommand succeeds', async () => {
    await expect(deleteTimerCommand(1)).resolves.toBeUndefined()
  })
})
