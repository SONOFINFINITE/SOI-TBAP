import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import {
  Robot,
  Command as CommandIcon,
  Timer,
  Plus,
  Trash,
  WifiHigh,
  WifiSlash,
  CircleNotch,
  ArrowsClockwise,
  SignOut,
  ToggleLeft,
  ToggleRight,
  MagnifyingGlass,
  ArrowRight,
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

  if (loading && !stats) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background">
        <CircleNotch size={40} className="animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-background text-foreground pb-20 relative overflow-hidden">
      {/* Background Anime Blobs */}
      <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-primary/10 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-blue-200/20 blur-[100px] rounded-full pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-50 px-4 py-4 glass-light mb-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full border border-border overflow-hidden shadow-sm">
              <img src="/01.jpg" alt="Logo" className="w-full h-full object-cover" />
            </div>
            <span className="font-serif font-bold text-xl tracking-tight text-foreground">Панель Управления</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full border border-border overflow-hidden shadow-sm">
                <img src="/01.jpg" alt="User" className="w-full h-full object-cover" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">{admin?.username}</span>
            </div>
            <button
              onClick={handleLogout}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
              <SignOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 space-y-12 relative z-10">
        {/* Stats Bento Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6"
        >
          <StatCard
            icon={<Robot size={28} className="text-primary" weight="duotone" />}
            label="Активный бот"
            value={stats?.botUsername || '...'}
          />
          <StatCard
            icon={stats?.stream === 'online' ? <WifiHigh size={28} className="text-success" weight="duotone" /> : <WifiSlash size={28} className="text-muted-foreground" />}
            label="Статус стрима"
            value={stats?.stream === 'online' ? 'Online' : 'Offline'}
            valueClass={stats?.stream === 'online' ? 'text-success' : 'text-muted-foreground'}
          />
          <StatCard
            icon={<CommandIcon size={28} className="text-blue-400" weight="duotone" />}
            label="Команды"
            value={`${enabledCommands}`}
            subValue={`из ${commands.length}`}
          />
          <StatCard
            icon={<Timer size={28} className="text-purple-400" weight="duotone" />}
            label="Таймеры"
            value={`${enabledTimers}`}
            subValue={`из ${timers.length}`}
          />
        </motion.div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="text-sm text-destructive bg-destructive/5 border border-destructive/20 rounded-2xl px-6 py-4 flex items-center justify-between"
          >
            <span>{error}</span>
            <button onClick={() => setError('')} className="underline text-destructive/70 hover:text-destructive">Закрыть</button>
          </motion.div>
        )}

        {/* Search & Actions Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex gap-2 p-1.5 bg-white rounded-full border border-border shadow-sm w-max">
            <TabButton
              active={activeTab === 'commands'}
              onClick={() => setActiveTab('commands')}
              label="Команды"
              count={commands.length}
            />
            <TabButton
              active={activeTab === 'timers'}
              onClick={() => setActiveTab('timers')}
              label="Таймеры"
              count={timers.length}
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="relative group">
              <MagnifyingGlass
                size={20}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Поиск по триггеру..."
                className="h-12 pl-12 pr-5 rounded-full bg-white border border-border text-base w-full md:w-64 focus:w-full md:focus:w-80 transition-all focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground shadow-sm"
              />
            </div>
            <button
              onClick={fetchData}
              className="w-12 h-12 flex items-center justify-center rounded-full bg-white border border-border shadow-sm hover:bg-muted transition-all active:scale-95"
            >
              <ArrowsClockwise size={20} className={cn(loading && 'animate-spin')} />
            </button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(activeTab === 'commands' ? '/commands/new' : '/timers/new')}
              className="h-12 px-6 rounded-full bg-foreground text-background text-base font-bold flex items-center gap-2 group shadow-lg hover:shadow-xl transition-all"
            >
              <span>Создать</span>
              <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center group-hover:rotate-90 transition-transform duration-300">
                <Plus size={16} weight="bold" />
              </div>
            </motion.button>
          </div>
        </div>

        {/* Content List */}
        <AnimatePresence mode="wait">
          {activeTab === 'commands' ? (
            <motion.div
              key="commands"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filteredCommands.map((cmd, i) => (
                <CommandCard
                  key={cmd.id}
                  index={i}
                  command={cmd}
                  togglingId={togglingId}
                  deletingId={deletingId}
                  onEdit={() => navigate(`/commands/${cmd.id}/edit`)}
                  onToggle={() => handleToggleCommand(cmd)}
                  onDelete={() => handleDeleteCommand(cmd.id)}
                />
              ))}
              {filteredCommands.length === 0 && <EmptyState icon={<CommandIcon size={48} />} label="Команды не найдены" />}
            </motion.div>
          ) : (
            <motion.div
              key="timers"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {filteredTimers.map((timer, i) => (
                <TimerCard
                  key={timer.id}
                  index={i}
                  timer={timer}
                  togglingId={togglingId}
                  deletingId={deletingId}
                  onEdit={() => navigate(`/timers/${timer.id}/edit`)}
                  onToggle={() => handleToggleTimer(timer)}
                  onDelete={() => handleDeleteTimer(timer.id)}
                />
              ))}
              {filteredTimers.length === 0 && <EmptyState icon={<Timer size={48} />} label="Таймеры не найдены" />}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}

// Sub-components

function StatCard({
  icon,
  label,
  value,
  subValue,
  valueClass,
  className,
}: {
  icon: React.ReactNode
  label: string
  value: string
  subValue?: string
  valueClass?: string
  className?: string
}) {
  return (
    <div className={cn('paper-card p-6 h-36 flex flex-col justify-between', className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider font-bold text-muted-foreground">{label}</span>
        <div className="bg-muted p-2 rounded-xl">{icon}</div>
      </div>
      <div className="flex items-baseline gap-3">
        <span className={cn('text-4xl font-serif text-foreground', valueClass)}>{value}</span>
        {subValue && <span className="text-sm text-muted-foreground font-medium">{subValue}</span>}
      </div>
    </div>
  )
}

function TabButton({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean
  onClick: () => void
  label: string
  count: number
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'relative px-6 py-2.5 rounded-full text-base font-bold transition-all duration-300',
        active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
      )}
    >
      {active && (
        <motion.div
          layoutId="activeTab"
          className="absolute inset-0 bg-accent rounded-full"
        />
      )}
      <span className="relative z-10 flex items-center gap-2">
        {label}
        <span className={cn('text-xs px-2 py-0.5 rounded-full', active ? 'bg-white text-primary shadow-sm' : 'bg-muted text-muted-foreground')}>
          {count}
        </span>
      </span>
    </button>
  )
}

function CommandCard({
  command,
  index,
  togglingId,
  deletingId,
  onEdit,
  onToggle,
  onDelete,
}: {
  command: Command
  index: number
  togglingId: number | null
  deletingId: number | null
  onEdit: () => void
  onToggle: () => void
  onDelete: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.5, ease: [0.175, 0.885, 0.32, 1.275] }}
      onClick={onEdit}
      className={cn('paper-card paper-card-hover group flex flex-col', command.enabled === 0 && 'grayscale opacity-60')}
    >
      <div className="p-6 flex-1 space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <code className="text-lg font-bold font-mono text-foreground group-hover:text-primary transition-colors">
              {command.trigger}
            </code>
            <p className="text-xs uppercase tracking-widest text-muted-foreground font-bold">
              {COMMAND_TYPE_LABELS[command.type]}
            </p>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onToggle(); }}
            disabled={togglingId === command.id}
            className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-border transition-all"
          >
            {togglingId === command.id ? (
              <CircleNotch size={20} className="animate-spin" />
            ) : command.enabled === 1 ? (
              <ToggleRight size={28} className="text-success" weight="fill" />
            ) : (
              <ToggleLeft size={28} className="text-muted-foreground" />
            )}
          </button>
        </div>

        <p className="text-sm text-foreground/80 line-clamp-2 min-h-10 leading-relaxed" title={command.response}>
          {command.response}
        </p>
      </div>

      <div className="px-6 py-4 flex items-center justify-between border-t border-border bg-muted/30 rounded-b-3xl">
        <div className="flex gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            disabled={deletingId === command.id}
            className="w-9 h-9 rounded-full bg-white flex items-center justify-center hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all shadow-sm border border-border"
          >
            {deletingId === command.id ? <CircleNotch size={16} className="animate-spin" /> : <Trash size={16} />}
          </button>
        </div>
        <div className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1 group-hover:translate-x-1 transition-transform">
          Редактировать <ArrowRight size={14} />
        </div>
      </div>
    </motion.div>
  )
}

function TimerCard({
  timer,
  index,
  togglingId,
  deletingId,
  onEdit,
  onToggle,
  onDelete,
}: {
  timer: TimerCommand
  index: number
  togglingId: number | null
  deletingId: number | null
  onEdit: () => void
  onToggle: () => void
  onDelete: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.5, ease: [0.175, 0.885, 0.32, 1.275] }}
      onClick={onEdit}
      className={cn('paper-card paper-card-hover group flex flex-col', timer.enabled === 0 && 'grayscale opacity-60')}
    >
      <div className="p-6 flex-1 space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <code className="text-lg font-bold font-mono text-foreground group-hover:text-primary transition-colors">{timer.name}</code>
              <span className="text-xs bg-accent text-primary px-3 py-1 rounded-full font-bold tracking-tight">
                {timer.interval_minutes} мин
              </span>
            </div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground font-bold">
              Авто-сообщение
            </p>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onToggle(); }}
            disabled={togglingId === timer.id}
            className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-border transition-all"
          >
            {togglingId === timer.id ? (
              <CircleNotch size={20} className="animate-spin" />
            ) : timer.enabled === 1 ? (
              <ToggleRight size={28} className="text-success" weight="fill" />
            ) : (
              <ToggleLeft size={28} className="text-muted-foreground" />
            )}
          </button>
        </div>

        <p className="text-sm text-foreground/80 line-clamp-2 min-h-10 leading-relaxed" title={timer.message}>
          {timer.message}
        </p>
      </div>

      <div className="px-6 py-4 flex items-center justify-between border-t border-border bg-muted/30 rounded-b-3xl">
        <div className="flex gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            disabled={deletingId === timer.id}
            className="w-9 h-9 rounded-full bg-white flex items-center justify-center hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all shadow-sm border border-border"
          >
            {deletingId === timer.id ? <CircleNotch size={16} className="animate-spin" /> : <Trash size={16} />}
          </button>
        </div>
        <div className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1 group-hover:translate-x-1 transition-transform">
          Редактировать <ArrowRight size={14} />
        </div>
      </div>
    </motion.div>
  )
}

function EmptyState({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="col-span-full py-24 flex flex-col items-center justify-center space-y-6 opacity-60">
      <div className="w-24 h-24 rounded-full bg-white border border-border shadow-sm flex items-center justify-center text-primary">
        {icon}
      </div>
      <p className="text-base font-serif font-bold text-foreground">{label}</p>
    </div>
  )
}
