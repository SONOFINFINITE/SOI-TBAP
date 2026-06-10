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
    <div className="min-h-dvh bg-background text-white pb-20">
      <header className="fixed top-0 left-0 right-0 z-50 px-4 py-4 pointer-events-none">
        <div className="max-w-2xl mx-auto flex items-center gap-3 pointer-events-auto">
          <button
            onClick={() => navigate(-1)}
            className="glass w-11 h-11 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors text-white/70"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="glass px-4 h-11 rounded-full flex items-center gap-3">
            <Timer size={20} className="text-white" weight="duotone" />
            <span className="font-bold text-xs tracking-tight uppercase">
              {isEdit ? 'Таймер' : 'Новый таймер'}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 pt-24">
        <motion.form 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit} 
          className="space-y-8"
        >
          {/* Имя */}
          <FieldGroup label="Имя таймера" error={fieldErrors.name}>
            <div className="double-bezel">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="promo_tg"
                className="w-full h-11 px-4 double-bezel-inner text-sm font-mono focus:outline-none focus:ring-1 focus:ring-white/20"
              />
            </div>
          </FieldGroup>

          {/* Сообщение */}
          <FieldGroup label="Текст сообщения" error={fieldErrors.message}>
            <div className="double-bezel">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Подпишись на мой Telegram..."
                rows={4}
                className="w-full px-4 py-3 double-bezel-inner text-sm focus:outline-none focus:ring-1 focus:ring-white/20 resize-none"
              />
            </div>
          </FieldGroup>

          {/* Интервал */}
          <FieldGroup label="Интервал (минуты)" error={fieldErrors.interval}>
            <div className="double-bezel">
              <input
                type="number"
                value={intervalMinutes}
                min={1}
                onChange={(e) => setIntervalMinutes(Number(e.target.value))}
                className="w-full h-11 px-4 double-bezel-inner text-sm font-mono focus:outline-none focus:ring-1 focus:ring-white/20"
              />
            </div>
            <div className="flex items-start gap-2 mt-2 px-1">
              <Info size={14} className="mt-0.5 text-white/30" />
              <p className="text-[11px] text-white/40 leading-relaxed">
                Сообщение будет отправляться в чат автоматически каждые {intervalMinutes} мин.
              </p>
            </div>
          </FieldGroup>

          {/* Статус */}
          <div className="flex items-center justify-between p-6 double-bezel">
             <div className="double-bezel-inner w-full flex items-center justify-between p-4">
                <div className="space-y-0.5">
                  <p className="text-sm font-bold">Активность таймера</p>
                  <p className="text-[11px] text-white/30">Таймер будет работать во время стрима</p>
                </div>
                <button
                  type="button"
                  onClick={() => setEnabled(!enabled)}
                  className="w-12 h-6 rounded-full bg-white/5 border border-white/5 relative transition-colors"
                >
                  <motion.div
                    animate={{ x: enabled ? 24 : 4 }}
                    className={cn('absolute top-1 w-4 h-4 rounded-full shadow-lg', enabled ? 'bg-success' : 'bg-white/20')}
                  />
                </button>
             </div>
          </div>

          {error && <p className="text-xs text-destructive text-center">{error}</p>}

          {/* Actions */}
          <div className="flex items-center gap-4 pt-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="flex-1 h-12 rounded-full bg-white text-black text-sm font-bold flex items-center justify-center gap-2 group shadow-xl shadow-white/5"
            >
              {loading ? <CircleNotch size={18} className="animate-spin" /> : (
                <>
                  <span>Сохранить</span>
                  <div className="w-6 h-6 rounded-full bg-black/5 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                    <FloppyDisk size={14} weight="bold" />
                  </div>
                </>
              )}
            </motion.button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="h-12 px-8 rounded-full glass text-sm font-bold text-white/40 hover:text-white transition-all"
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
      <label className="text-[11px] uppercase tracking-[0.2em] font-bold text-white/30 ml-1">{label}</label>
      {children}
      {error && <p className="text-[11px] text-destructive ml-1">{error}</p>}
    </div>
  )
}
