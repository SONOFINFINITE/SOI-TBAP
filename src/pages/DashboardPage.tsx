import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Robot,
  Command as CommandIcon,
  Timer,
  Plus,
  PencilSimple,
  Trash,
  WifiHigh,
  WifiSlash,
  CircleNotch,
  ArrowsClockwise,
  SignOut,
  ToggleLeft,
  ToggleRight,
  MagnifyingGlass,
} from '@phosphor-icons/react'
import {
  getStats,
  getCommands,
  getTimerCommands,
  deleteCommand,
  deleteTimerCommand,
  updateCommand,
  updateTimerCommand,
} from '@/api/client'
import { useAuthStore } from '@/store/auth'
import { cn } from '@/lib/utils'
import type { Command, TimerCommand, BotStats } from '@/types/api'
import { COMMAND_TYPE_LABELS } from '@/types/api'

type TabType = 'commands' | 'timers'

export function DashboardPage() {
  const navigate = useNavigate()
  const { admin, logout } = useAuthStore()

  const [stats, setStats] = useState<BotStats | null>(null)
  const [commands, setCommands] = useState<Command[]>([])
  const [timers, setTimers] = useState<TimerCommand[]>([])
  const [activeTab, setActiveTab] = useState<TabType>('commands')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [togglingId, setTogglingId] = useState<number | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [s, c, t] = await Promise.all([getStats(), getCommands(), getTimerCommands()])
      setStats(s)
      setCommands(c)
      setTimers(t)
    } catch {
      setError('Не удалось загрузить данные')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  async function handleDeleteCommand(id: number) {
    if (!confirm('Удалить эту команду?')) return
    setDeletingId(id)
    try {
      await deleteCommand(id)
      setCommands((prev) => prev.filter((c) => c.id !== id))
    } catch {
      setError('Не удалось удалить команду')
    } finally {
      setDeletingId(null)
    }
  }

  async function handleDeleteTimer(id: number) {
    if (!confirm('Удалить этот таймер?')) return
    setDeletingId(id)
    try {
      await deleteTimerCommand(id)
      setTimers((prev) => prev.filter((t) => t.id !== id))
    } catch {
      setError('Не удалось удалить таймер')
    } finally {
      setDeletingId(null)
    }
  }

  async function handleToggleCommand(cmd: Command) {
    setTogglingId(cmd.id)
    try {
      const updated = await updateCommand(cmd.id, { enabled: cmd.enabled === 0 })
      setCommands((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
    } catch {
      setError('Не удалось изменить статус')
    } finally {
      setTogglingId(null)
    }
  }

  async function handleToggleTimer(timer: TimerCommand) {
    setTogglingId(timer.id)
    try {
      const updated = await updateTimerCommand(timer.id, { enabled: timer.enabled === 0 })
      setTimers((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
    } catch {
      setError('Не удалось изменить статус')
    } finally {
      setTogglingId(null)
    }
  }

  const filteredCommands = commands.filter(
    (c) =>
      c.trigger.toLowerCase().includes(search.toLowerCase()) ||
      c.response.toLowerCase().includes(search.toLowerCase())
  )

  const filteredTimers = timers.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.message.toLowerCase().includes(search.toLowerCase())
  )

  const enabledCommands = commands.filter((c) => c.enabled === 1).length
  const enabledTimers = timers.filter((t) => t.enabled === 1).length

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <CircleNotch size={32} className="animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-background">
      {/* Header */}
      <header className="border-b sticky top-0 bg-background/80 backdrop-blur-sm z-10">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Robot size={24} className="text-primary" weight="bold" />
            <span className="font-semibold text-sm">Twitch Bot Admin</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">{admin?.username}</span>
            <button
              onClick={handleLogout}
              className="p-2 rounded-md hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
              title="Выйти"
            >
              <SignOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Статистика */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard
              icon={<Robot size={20} weight="bold" />}
              label="Бот"
              value={stats.botUsername}
            />
            <StatCard
              icon={stats.stream === 'online' ? <WifiHigh size={20} weight="bold" /> : <WifiSlash size={20} />}
              label="Стрим"
              value={stats.stream === 'online' ? 'Онлайн' : 'Оффлайн'}
              valueClass={stats.stream === 'online' ? 'text-success' : 'text-muted-foreground'}
            />
            <StatCard
              icon={<CommandIcon size={20} weight="bold" />}
              label="Команды"
              value={`${enabledCommands} / ${commands.length}`}
            />
            <StatCard
              icon={<Timer size={20} weight="bold" />}
              label="Таймеры"
              value={`${enabledTimers} / ${timers.length}`}
            />
          </div>
        )}

        {error && (
          <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError('')} className="text-xs underline">
              Закрыть
            </button>
          </div>
        )}

        {/* Табы и Действия */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex gap-1 bg-muted rounded-lg p-1">
            <TabButton
              active={activeTab === 'commands'}
              onClick={() => setActiveTab('commands')}
              icon={<CommandIcon size={16} />}
              label={`Команды (${commands.length})`}
            />
            <TabButton
              active={activeTab === 'timers'}
              onClick={() => setActiveTab('timers')}
              icon={<Timer size={16} />}
              label={`Таймеры (${timers.length})`}
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <MagnifyingGlass
                size={16}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Поиск..."
                className="h-8 pl-8 pr-3 rounded-md bg-muted border text-sm w-40 focus:w-56 transition-all focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground/50"
              />
            </div>
            <button
              onClick={fetchData}
              className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-secondary transition-colors text-muted-foreground"
              title="Обновить"
            >
              <ArrowsClockwise size={16} />
            </button>
            <button
              onClick={() =>
                navigate(activeTab === 'commands' ? '/commands/new' : '/timers/new')
              }
              className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-1.5"
            >
              <Plus size={14} weight="bold" />
              Создать
            </button>
          </div>
        </div>

        {/* Контент */}
        {activeTab === 'commands' && (
          <CommandsList
            commands={filteredCommands}
            deletingId={deletingId}
            togglingId={togglingId}
            onEdit={(id) => navigate(`/commands/${id}/edit`)}
            onDelete={handleDeleteCommand}
            onToggle={handleToggleCommand}
          />
        )}

        {activeTab === 'timers' && (
          <TimersList
            timers={filteredTimers}
            deletingId={deletingId}
            togglingId={togglingId}
            onEdit={(id) => navigate(`/timers/${id}/edit`)}
            onDelete={handleDeleteTimer}
            onToggle={handleToggleTimer}
          />
        )}
      </main>
    </div>
  )
}

// Вспомогательные компоненты

function StatCard({
  icon,
  label,
  value,
  valueClass,
}: {
  icon: React.ReactNode
  label: string
  value: string
  valueClass?: string
}) {
  return (
    <div className="bg-card border rounded-lg p-4 space-y-2">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className={cn('text-lg font-semibold truncate', valueClass)}>{value}</p>
    </div>
  )
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
        active ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
      )}
    >
      {icon}
      {label}
    </button>
  )
}

function CommandsList({
  commands,
  deletingId,
  togglingId,
  onEdit,
  onDelete,
  onToggle,
}: {
  commands: Command[]
  deletingId: number | null
  togglingId: number | null
  onEdit: (id: number) => void
  onDelete: (id: number) => void
  onToggle: (cmd: Command) => void
}) {
  if (commands.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <CommandIcon size={40} className="mx-auto mb-3 opacity-30" />
        <p className="text-sm">Команды не найдены</p>
        <p className="text-xs mt-1">Создайте первую команду, нажав кнопку "Создать"</p>
      </div>
    )
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="hidden md:grid grid-cols-[1fr_120px_1fr_80px_100px] gap-4 px-4 py-2.5 bg-muted/50 text-xs font-medium text-muted-foreground uppercase tracking-wide">
        <span>Триггер</span>
        <span>Тип</span>
        <span>Ответ</span>
        <span>Статус</span>
        <span className="text-right">Действия</span>
      </div>
      {commands.map((cmd) => (
        <div
          key={cmd.id}
          className={cn(
            'grid grid-cols-1 md:grid-cols-[1fr_120px_1fr_80px_100px] gap-2 md:gap-4 px-4 py-3 border-t items-center',
            cmd.enabled === 0 && 'opacity-50'
          )}
        >
          <div>
            <code className="text-sm font-mono bg-muted px-1.5 py-0.5 rounded">{cmd.trigger}</code>
          </div>
          <div>
            <span className="text-xs bg-secondary px-2 py-0.5 rounded-md">
              {COMMAND_TYPE_LABELS[cmd.type]}
            </span>
          </div>
          <div className="text-sm text-muted-foreground truncate" title={cmd.response}>
            {cmd.response}
          </div>
          <div>
            <button
              onClick={() => onToggle(cmd)}
              disabled={togglingId === cmd.id}
              className="text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
              title={cmd.enabled === 1 ? 'Отключить' : 'Включить'}
            >
              {togglingId === cmd.id ? (
                <CircleNotch size={20} className="animate-spin" />
              ) : cmd.enabled === 1 ? (
                <ToggleRight size={20} className="text-success" weight="fill" />
              ) : (
                <ToggleLeft size={20} />
              )}
            </button>
          </div>
          <div className="flex items-center justify-end gap-1">
            <button
              onClick={() => onEdit(cmd.id)}
              className="p-1.5 rounded-md hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
              title="Редактировать"
            >
              <PencilSimple size={16} />
            </button>
            <button
              onClick={() => onDelete(cmd.id)}
              disabled={deletingId === cmd.id}
              className="p-1.5 rounded-md hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive disabled:opacity-50"
              title="Удалить"
            >
              {deletingId === cmd.id ? (
                <CircleNotch size={16} className="animate-spin" />
              ) : (
                <Trash size={16} />
              )}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

function TimersList({
  timers,
  deletingId,
  togglingId,
  onEdit,
  onDelete,
  onToggle,
}: {
  timers: TimerCommand[]
  deletingId: number | null
  togglingId: number | null
  onEdit: (id: number) => void
  onDelete: (id: number) => void
  onToggle: (timer: TimerCommand) => void
}) {
  if (timers.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <Timer size={40} className="mx-auto mb-3 opacity-30" />
        <p className="text-sm">Таймеры не найдены</p>
        <p className="text-xs mt-1">Создайте первый таймер, нажав кнопку "Создать"</p>
      </div>
    )
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="hidden md:grid grid-cols-[1fr_1fr_100px_80px_100px] gap-4 px-4 py-2.5 bg-muted/50 text-xs font-medium text-muted-foreground uppercase tracking-wide">
        <span>Имя</span>
        <span>Сообщение</span>
        <span>Интервал</span>
        <span>Статус</span>
        <span className="text-right">Действия</span>
      </div>
      {timers.map((timer) => (
        <div
          key={timer.id}
          className={cn(
            'grid grid-cols-1 md:grid-cols-[1fr_1fr_100px_80px_100px] gap-2 md:gap-4 px-4 py-3 border-t items-center',
            timer.enabled === 0 && 'opacity-50'
          )}
        >
          <div>
            <code className="text-sm font-mono bg-muted px-1.5 py-0.5 rounded">{timer.name}</code>
          </div>
          <div className="text-sm text-muted-foreground truncate" title={timer.message}>
            {timer.message}
          </div>
          <div className="text-sm">
            <span className="font-mono">{timer.interval_minutes}</span>{' '}
            <span className="text-muted-foreground text-xs">мин</span>
          </div>
          <div>
            <button
              onClick={() => onToggle(timer)}
              disabled={togglingId === timer.id}
              className="text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
              title={timer.enabled === 1 ? 'Отключить' : 'Включить'}
            >
              {togglingId === timer.id ? (
                <CircleNotch size={20} className="animate-spin" />
              ) : timer.enabled === 1 ? (
                <ToggleRight size={20} className="text-success" weight="fill" />
              ) : (
                <ToggleLeft size={20} />
              )}
            </button>
          </div>
          <div className="flex items-center justify-end gap-1">
            <button
              onClick={() => onEdit(timer.id)}
              className="p-1.5 rounded-md hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
              title="Редактировать"
            >
              <PencilSimple size={16} />
            </button>
            <button
              onClick={() => onDelete(timer.id)}
              disabled={deletingId === timer.id}
              className="p-1.5 rounded-md hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive disabled:opacity-50"
              title="Удалить"
            >
              {deletingId === timer.id ? (
                <CircleNotch size={16} className="animate-spin" />
              ) : (
                <Trash size={16} />
              )}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
