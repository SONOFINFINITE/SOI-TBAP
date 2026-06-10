import axios from 'axios'
import type {
  Command,
  CommandCreate,
  CommandUpdate,
  TimerCommand,
  TimerCommandCreate,
  TimerCommandUpdate,
  LoginRequest,
  LoginResponse,
  AdminInfo,
  BotStats,
  CommandType,
} from '@/types/api'

const API_BASE = import.meta.env.DEV
  ? 'https://soi-tsuesiro-render.onrender.com'
  : ''

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
})

// Интерцептор для добавления JWT-токена
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Интерцептор для обработки 401 ошибок
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('admin')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth
export async function login(data: LoginRequest): Promise<LoginResponse> {
  const res = await api.post<LoginResponse>('/api/auth/login', data)
  return res.data
}

export async function getMe(): Promise<AdminInfo> {
  const res = await api.get<AdminInfo>('/api/auth/me')
  return res.data
}

// Stats
export async function getStats(): Promise<BotStats> {
  const res = await api.get<BotStats>('/stats')
  return res.data
}

// Commands
export async function getCommands(): Promise<Command[]> {
  const res = await api.get<Command[]>('/api/commands')
  return res.data
}

export async function getCommand(id: number): Promise<Command> {
  const res = await api.get<Command>(`/api/commands/${id}`)
  return res.data
}

export async function createCommand(data: CommandCreate): Promise<Command> {
  const res = await api.post<Command>('/api/commands', data)
  return res.data
}

export async function updateCommand(id: number, data: CommandUpdate): Promise<Command> {
  const res = await api.put<Command>(`/api/commands/${id}`, data)
  return res.data
}

export async function deleteCommand(id: number): Promise<void> {
  await api.delete(`/api/commands/${id}`)
}

export async function getCommandTypes(): Promise<CommandType[]> {
  const res = await api.get<CommandType[]>('/api/commands/types')
  return res.data
}

// Timer Commands
export async function getTimerCommands(): Promise<TimerCommand[]> {
  const res = await api.get<TimerCommand[]>('/api/timer-commands')
  return res.data
}

export async function getTimerCommand(id: number): Promise<TimerCommand> {
  const res = await api.get<TimerCommand>(`/api/timer-commands/${id}`)
  return res.data
}

export async function createTimerCommand(data: TimerCommandCreate): Promise<TimerCommand> {
  const res = await api.post<TimerCommand>('/api/timer-commands', data)
  return res.data
}

export async function updateTimerCommand(id: number, data: TimerCommandUpdate): Promise<TimerCommand> {
  const res = await api.put<TimerCommand>(`/api/timer-commands/${id}`, data)
  return res.data
}

export async function deleteTimerCommand(id: number): Promise<void> {
  await api.delete(`/api/timer-commands/${id}`)
}

export default api
