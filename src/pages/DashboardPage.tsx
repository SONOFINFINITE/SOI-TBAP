import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
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
      <div className="min-h-[100dvh] flex items-center justify-center bg-background">
        <CircleNotch size={32} className="animate-spin text-white/20" />
      </div>
    )
  }

  return (
    <div className="min-h-[100dvh] bg-background text-white pb-20">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 px-4 py-4 pointer-events-none">
        <div className="max-w-6xl mx-auto flex items-center justify-between pointer-events-auto">
          <div className="glass px-4 h-11 rounded-full flex items-center gap-3">
            <Robot size={20} className="text-white" weight="duotone" />
            <span className="font-bold text-xs tracking-tight uppercase">Dashboard</span>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="glass px-4 h-11 rounded-full flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              <span className="text-xs font-medium text-white/70">{admin?.username}</span>
            </div>
            <button
              onClick={handleLogout}
              className="glass w-11 h-11 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors text-white/70 hover:text-white"
            >
              <SignOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 pt-24 space-y-12">
        {/* Stats Bento Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          <StatCard
            icon={<Robot size={24} weight="duotone" />}
            label="Активный бот"
            value={stats?.botUsername || '...'}
            subValue={`Uptime: ${stats ? Math.floor(stats.uptime / 3600) : 0}h`}
          />
          <StatCard
            icon={stats?.stream === 'online' ? <WifiHigh size={24} weight="duotone" /> : <WifiSlash size={24} />}
            label="Статус стрима"
            value={stats?.stream === 'online' ? 'Online' : 'Offline'}
            valueClass={stats?.stream === 'online' ? 'text-success' : 'text-white/40'}
          />
          <StatCard
            icon={<CommandIcon size={24} weight="duotone" />}
            label="Команды"
            value={`${enabledCommands}`}
            subValue={`из ${commands.length}`}
          />
          <StatCard
            icon={<Timer size={24} weight="duotone" />}
            label="Таймеры"
            value={`${enabledTimers}`}
            subValue={`из ${timers.length}`}
          />
        </motion.div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="text-xs text-destructive bg-destructive/5 border border-destructive/10 rounded-lg px-4 py-3 flex items-center justify-between"
          >
            <span>{error}</span>
            <button onClick={() => setError('')} className="underline text-white/50 hover:text-white">Закрыть</button>
          </motion.div>
        )}

        {/* Search & Actions Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex gap-2 p-1 bg-white/5 rounded-2xl w-max border border-white/5">
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
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-white transition-colors"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Поиск по триггеру..."
                className="h-11 pl-11 pr-4 rounded-full bg-white/5 border border-white/5 text-sm w-full md:w-64 focus:w-full md:focus:w-80 transition-all focus:outline-none focus:ring-1 focus:ring-white/20 placeholder:text-white/20"
              />
            </div>
            <button
              onClick={fetchData}
              className="w-11 h-11 flex items-center justify-center rounded-full glass hover:bg-white/10 transition-all active:scale-95"
            >
              <ArrowsClockwise size={18} className={cn(loading && 'animate-spin')} />
            </button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(activeTab === 'commands' ? '/commands/new' : '/timers/new')}
              className="h-11 px-5 rounded-full bg-white text-black text-sm font-bold flex items-center gap-2 group shadow-xl shadow-white/5"
            >
              <span>Создать</span>
              <div className="w-6 h-6 rounded-full bg-black/5 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                <Plus size={14} weight="bold" />
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
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
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
              {filteredCommands.length === 0 && <EmptyState icon={<CommandIcon size={40} />} label="Команды не найдены" />}
            </motion.div>
          ) : (
            <motion.div
              key="timers"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
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
              {filteredTimers.length === 0 && <EmptyState icon={<Timer size={40} />} label="Таймеры не найдены" />}
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
    <div className={cn('double-bezel h-32', className)}>
      <div className="double-bezel-inner h-full p-6 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/30">{label}</span>
          <div className="text-white/20">{icon}</div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className={cn('text-2xl font-bold tracking-tight', valueClass)}>{value}</span>
          {subValue && <span className="text-xs text-white/20 font-medium">{subValue}</span>}
        </div>
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
        'relative px-6 py-2 rounded-xl text-sm font-bold transition-all duration-300',
        active ? 'text-white' : 'text-white/30 hover:text-white/60'
      )}
    >
      {active && (
        <motion.div
          layoutId="activeTab"
          className="absolute inset-0 bg-white/10 rounded-xl ring-1 ring-white/10 shadow-inner"
        />
      )}
      <span className="relative z-10 flex items-center gap-2">
        {label}
        <span className={cn('text-[10px] px-1.5 py-0.5 rounded-md', active ? 'bg-white/10 text-white' : 'bg-white/5 text-white/20')}>
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
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05, duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
      className={cn('double-bezel group', command.enabled === 0 && 'grayscale opacity-50')}
    >
      <div className="double-bezel-inner p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <code className="text-sm font-bold font-mono text-white group-hover:text-success transition-colors">
              {command.trigger}
            </code>
            <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold">
              {COMMAND_TYPE_LABELS[command.type]}
            </p>
          </div>
          <button
            onClick={onToggle}
            disabled={togglingId === command.id}
            className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all"
          >
            {togglingId === command.id ? (
              <CircleNotch size={14} className="animate-spin" />
            ) : command.enabled === 1 ? (
              <ToggleRight size={20} className="text-success" weight="fill" />
            ) : (
              <ToggleLeft size={20} className="text-white/20" />
            )}
          </button>
        </div>

        <p className="text-xs text-white/60 line-clamp-2 min-h-8" title={command.response}>
          {command.response}
        </p>

        <div className="pt-2 flex items-center justify-between border-t border-white/5">
          <div className="flex gap-1">
            <button
              onClick={onEdit}
              className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 text-white/40 hover:text-white transition-all"
            >
              <PencilSimple size={14} />
            </button>
            <button
              onClick={onDelete}
              disabled={deletingId === command.id}
              className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-destructive/10 text-white/40 hover:text-destructive transition-all"
            >
              {deletingId === command.id ? <CircleNotch size={14} className="animate-spin" /> : <Trash size={14} />}
            </button>
          </div>
          <button onClick={onEdit} className="text-[10px] font-bold uppercase tracking-wider text-white/20 hover:text-white flex items-center gap-1 transition-all">
            Edit <ArrowRight size={10} />
          </button>
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
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05, duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
      className={cn('double-bezel group', timer.enabled === 0 && 'grayscale opacity-50')}
    >
      <div className="double-bezel-inner p-6 flex items-center justify-between gap-6">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-3">
            <code className="text-sm font-bold font-mono text-white">{timer.name}</code>
            <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded-full text-white/40 font-bold tracking-tight">
              {timer.interval_minutes}m
            </span>
          </div>
          <p className="text-xs text-white/50 truncate" title={timer.message}>
            {timer.message}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onToggle}
            disabled={togglingId === timer.id}
            className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all"
          >
            {togglingId === timer.id ? (
              <CircleNotch size={16} className="animate-spin" />
            ) : timer.enabled === 1 ? (
              <ToggleRight size={24} className="text-success" weight="fill" />
            ) : (
              <ToggleLeft size={24} className="text-white/20" />
            )}
          </button>
          <div className="w-px h-8 bg-white/5 mx-1" />
          <button
            onClick={onEdit}
            className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 text-white/40 hover:text-white transition-all"
          >
            <PencilSimple size={18} />
          </button>
          <button
            onClick={onDelete}
            disabled={deletingId === timer.id}
            className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-destructive/10 text-white/40 hover:text-destructive transition-all"
          >
            {deletingId === timer.id ? <CircleNotch size={18} className="animate-spin" /> : <Trash size={18} />}
          </button>
        </div>
      </div>
    </motion.div>
  )
}

function EmptyState({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="col-span-full py-20 flex flex-col items-center justify-center space-y-4 opacity-20">
      <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center">
        {icon}
      </div>
      <p className="text-sm font-bold uppercase tracking-[0.2em]">{label}</p>
    </div>
  )
}
