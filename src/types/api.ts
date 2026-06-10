// Типы команд бота
export type CommandType =
  | 'simple'
  | 'random_reply'
  | 'random_target'
  | 'random_target_action'
  | 'random_percent_target'
  | 'random_range'

// Вариант для типа random_range
export interface RangeVariant {
  min: number
  max: number
  text: string
}

// Команда бота
export interface Command {
  id: number
  trigger: string
  type: CommandType
  response: string
  variants: string[] | RangeVariant[] | null
  enabled: number // 0 | 1
  created_at: string
  updated_at: string
}

// Создание команды
export interface CommandCreate {
  trigger: string
  type?: CommandType
  response: string
  variants?: string[] | RangeVariant[] | null
  enabled?: boolean
}

// Обновление команды
export interface CommandUpdate {
  trigger?: string
  type?: CommandType
  response?: string
  variants?: string[] | RangeVariant[] | null
  enabled?: boolean
}

// Таймерная команда
export interface TimerCommand {
  id: number
  name: string
  message: string
  interval_minutes: number
  enabled: number // 0 | 1
  created_at: string
  updated_at: string
}

// Создание таймерной команды
export interface TimerCommandCreate {
  name: string
  message: string
  interval_minutes?: number
  enabled?: boolean
}

// Обновление таймерной команды
export interface TimerCommandUpdate {
  name?: string
  message?: string
  interval_minutes?: number
  enabled?: boolean
}

// Аутентификация
export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  token: string
  admin: AdminInfo
}

export interface AdminInfo {
  id: number
  username: string
}

// Статистика бота
export interface BotStats {
  status: string
  channel: string
  botUsername: string
  uptime: number
  timestamp: string
  stream: 'online' | 'offline'
  activeTimers: number
}

// API Error
export interface ApiError {
  error: string
}

// Описание типов команд для UI
export const COMMAND_TYPE_LABELS: Record<CommandType, string> = {
  simple: 'Простая',
  random_reply: 'Случайный ответ',
  random_target: 'Случайный юзер',
  random_target_action: 'Действие + юзер',
  random_percent_target: 'Проценты + юзер',
  random_range: 'Диапазоны',
}

export const COMMAND_TYPE_DESCRIPTIONS: Record<CommandType, string> = {
  simple: 'Статический ответ. Плейсхолдеры: {user}',
  random_reply: 'Случайный вариант из списка. Плейсхолдеры: {user}, {variant}',
  random_target: 'Случайный юзер из чата. Плейсхолдеры: {user}, {target}',
  random_target_action: 'Случайный юзер + действие. Плейсхолдеры: {user}, {target}, {variant}',
  random_percent_target: 'Проценты + случайный юзер. Плейсхолдеры: {user}, {target}, {percent}',
  random_range: 'Диапазоны с числом. Плейсхолдеры: {user}, {variant}, {size}',
}

// Типы, которые требуют variants
export const TYPES_REQUIRING_VARIANTS: CommandType[] = [
  'random_reply',
  'random_target_action',
  'random_range',
]
