import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowLeft, CircleNotch, FloppyDisk, Info, Timer } from '@phosphor-icons/react'
import { getTimerCommand, createTimerCommand, updateTimerCommand } from '@/api/client'
import { cn } from '@/lib/utils'
import type { TimerCommandCreate, TimerCommandUpdate } from '@/types/api'

export function TimerFormPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEdit = id !== undefined && id !== 'new'

  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [intervalMinutes, setIntervalMinutes] = useState(25)
  const [enabled, setEnabled] = useState(true)

  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(isEdit)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!isEdit) return
    setFetching(true)
    getTimerCommand(Number(id))
      .then((timer) => {
        setName(timer.name)
        setMessage(timer.message)
        setIntervalMinutes(timer.interval_minutes)
        setEnabled(timer.enabled === 1)
      })
      .catch(() => setError('Таймер не найден'))
      .finally(() => setFetching(false))
  }, [id, isEdit])

  function validate(): boolean {
    const errors: Record<string, string> = {}

    if (!name.trim()) {
      errors.name = 'Укажите имя таймера'
    }

    if (!message.trim()) {
      errors.message = 'Укажите текст сообщения'
    }

    if (intervalMinutes < 1) {
      errors.interval = 'Интервал должен быть не менее 1 минуты'
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    setError('')

    try {
      const data: TimerCommandUpdate = {
        name: name.trim(),
        message: message.trim(),
        interval_minutes: intervalMinutes,
        enabled,
      }

      if (isEdit) {
        await updateTimerCommand(Number(id), data)
      } else {
        await createTimerCommand(data as TimerCommandCreate)
      }

      navigate('/', { replace: true })
    } catch (err: unknown) {
      setError('Ошибка сохранения')
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background">
        <CircleNotch size={32} className="animate-spin text-white/20" />
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-background text-foreground pb-20 relative overflow-hidden">
      {/* Background Anime Blobs */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-primary/10 blur-[100px] rounded-full pointer-events-none" />

      <header className="sticky top-0 z-50 px-4 py-4 glass-light mb-8">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="w-12 h-12 rounded-full bg-white border border-border shadow-sm flex items-center justify-center hover:bg-muted transition-all active:scale-95 text-foreground"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="bg-muted p-2 rounded-xl">
              <Timer size={24} className="text-purple-400" weight="duotone" />
            </div>
            <span className="font-serif font-bold text-xl tracking-tight">
              {isEdit ? 'Редактировать таймер' : 'Новый таймер'}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 relative z-10">
        <motion.form 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.175, 0.885, 0.32, 1.275] }}
          onSubmit={handleSubmit} 
          className="space-y-8"
        >
          {/* Имя */}
          <FieldGroup label="Имя таймера" error={fieldErrors.name}>
            <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden focus-within:ring-2 focus-within:ring-primary/50 transition-shadow">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="promo_tg"
                className="w-full h-14 px-5 text-base font-mono focus:outline-none bg-transparent placeholder:text-muted-foreground/50"
              />
            </div>
          </FieldGroup>

          {/* Сообщение */}
          <FieldGroup label="Текст сообщения" error={fieldErrors.message}>
            <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden focus-within:ring-2 focus-within:ring-primary/50 transition-shadow">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Подпишись на мой Telegram..."
                rows={5}
                className="w-full p-5 text-base focus:outline-none bg-transparent resize-none placeholder:text-muted-foreground/50"
              />
            </div>
          </FieldGroup>

          {/* Интервал */}
          <FieldGroup label="Интервал (минуты)" error={fieldErrors.interval}>
            <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden focus-within:ring-2 focus-within:ring-primary/50 transition-shadow">
              <input
                type="number"
                value={intervalMinutes}
                min={1}
                onChange={(e) => setIntervalMinutes(Number(e.target.value))}
                className="w-full h-14 px-5 text-base font-mono focus:outline-none bg-transparent"
              />
            </div>
            <div className="flex items-start gap-2 mt-3 px-2">
              <Info size={16} className="mt-0.5 text-primary shrink-0" />
              <p className="text-sm text-muted-foreground leading-relaxed">
                Сообщение будет отправляться в чат автоматически каждые {intervalMinutes} мин.
              </p>
            </div>
          </FieldGroup>

          {/* Статус */}
          <div className="paper-card p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-base font-bold text-foreground">Активность таймера</p>
              <p className="text-sm text-muted-foreground">Таймер будет работать во время стрима</p>
            </div>
            <button
              type="button"
              onClick={() => setEnabled(!enabled)}
              className={cn(
                'w-14 h-8 rounded-full relative transition-colors duration-300 shadow-inner',
                enabled ? 'bg-success' : 'bg-border'
              )}
            >
              <motion.div
                animate={{ x: enabled ? 26 : 4 }}
                className="absolute top-1 w-6 h-6 rounded-full bg-white shadow-sm"
              />
            </button>
          </div>

          {error && <p className="text-sm text-destructive text-center bg-destructive/5 py-3 rounded-xl">{error}</p>}

          {/* Actions */}
          <div className="flex items-center gap-4 pt-6">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="flex-1 h-14 rounded-full bg-foreground text-background text-base font-bold flex items-center justify-center gap-3 group shadow-lg"
            >
              {loading ? <CircleNotch size={24} className="animate-spin" /> : (
                <>
                  <span>Сохранить</span>
                  <FloppyDisk size={20} weight="bold" className="group-hover:scale-110 transition-transform" />
                </>
              )}
            </motion.button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="h-14 px-8 rounded-full bg-white border border-border text-base font-bold text-foreground hover:bg-muted transition-all shadow-sm"
            >
              Отмена
            </button>
          </div>
        </motion.form>
      </main>
    </div>
  )
}

function FieldGroup({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-3">
      <label className="text-sm font-bold text-foreground ml-2">{label}</label>
      {children}
      {error && <p className="text-sm text-destructive ml-2">{error}</p>}
    </div>
  )
}
