import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CircleNotch, FloppyDisk, Info } from '@phosphor-icons/react'
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
      if (isEdit) {
        const data: TimerCommandUpdate = {
          name: name.trim(),
          message: message.trim(),
          interval_minutes: intervalMinutes,
          enabled,
        }
        await updateTimerCommand(Number(id), data)
      } else {
        const data: TimerCommandCreate = {
          name: name.trim(),
          message: message.trim(),
          interval_minutes: intervalMinutes,
          enabled,
        }
        await createTimerCommand(data)
      }

      navigate('/', { replace: true })
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { status?: number; data?: { error?: string } } }
        if (axiosErr.response?.status === 409) {
          setError('Таймер с таким именем уже существует')
        } else if (axiosErr.response?.status === 400) {
          setError(axiosErr.response.data?.error || 'Ошибка валидации')
        } else {
          setError(axiosErr.response?.data?.error || 'Ошибка сервера')
        }
      } else {
        setError('Нет соединения с сервером')
      }
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <CircleNotch size={32} className="animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b sticky top-0 bg-background/80 backdrop-blur-sm z-10">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-md hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="font-semibold text-sm">
            {isEdit ? 'Редактировать таймер' : 'Новый таймер'}
          </h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Имя */}
          <FieldGroup label="Имя таймера" error={fieldErrors.name}>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setFieldErrors((p) => ({ ...p, name: '' }))
              }}
              placeholder="tg_promo"
              className={cn(
                'w-full h-10 px-3 rounded-md bg-muted border text-sm font-mono',
                'placeholder:text-muted-foreground/50',
                'focus:outline-none focus:ring-2 focus:ring-ring',
                fieldErrors.name && 'border-destructive'
              )}
            />
          </FieldGroup>

          {/* Сообщение */}
          <FieldGroup label="Текст сообщения" error={fieldErrors.message}>
            <textarea
              value={message}
              onChange={(e) => {
                setMessage(e.target.value)
                setFieldErrors((p) => ({ ...p, message: '' }))
              }}
              placeholder="Подпишись на телегу t.me/..."
              rows={3}
              className={cn(
                'w-full px-3 py-2 rounded-md bg-muted border text-sm',
                'placeholder:text-muted-foreground/50 resize-y',
                'focus:outline-none focus:ring-2 focus:ring-ring',
                fieldErrors.message && 'border-destructive'
              )}
            />
          </FieldGroup>

          {/* Интервал */}
          <FieldGroup label="Интервал (минуты)" error={fieldErrors.interval}>
            <input
              type="number"
              value={intervalMinutes}
              min={1}
              onChange={(e) => {
                setIntervalMinutes(Number(e.target.value))
                setFieldErrors((p) => ({ ...p, interval: '' }))
              }}
              className={cn(
                'w-full h-10 px-3 rounded-md bg-muted border text-sm font-mono',
                'focus:outline-none focus:ring-2 focus:ring-ring',
                fieldErrors.interval && 'border-destructive'
              )}
            />
            <div className="flex items-start gap-1.5 mt-1.5 text-xs text-muted-foreground">
              <Info size={14} className="mt-0.5 shrink-0" />
              <span>Сообщение отправляется в чат каждые N минут, пока стрим онлайн</span>
            </div>
          </FieldGroup>

          {/* Статус */}
          <FieldGroup label="Статус">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="sr-only"
              />
              <div
                className={cn(
                  'w-9 h-5 rounded-full transition-colors relative',
                  enabled ? 'bg-primary' : 'bg-muted-foreground/30'
                )}
              >
                <div
                  className={cn(
                    'absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform',
                    enabled ? 'translate-x-4' : 'translate-x-0.5'
                  )}
                />
              </div>
              <span className="text-sm">{enabled ? 'Активен' : 'Отключен'}</span>
            </label>
          </FieldGroup>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
              {error}
            </div>
          )}

          {/* Кнопки */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className={cn(
                'h-10 px-5 rounded-md bg-primary text-primary-foreground text-sm font-medium',
                'hover:bg-primary/90 transition-colors',
                'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'flex items-center gap-2'
              )}
            >
              {loading ? (
                <CircleNotch size={16} className="animate-spin" />
              ) : (
                <FloppyDisk size={16} weight="bold" />
              )}
              {loading ? 'Сохранение...' : 'Сохранить'}
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="h-10 px-5 rounded-md border text-sm font-medium hover:bg-secondary transition-colors"
            >
              Отмена
            </button>
          </div>
        </form>
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
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
