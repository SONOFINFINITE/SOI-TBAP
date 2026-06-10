import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  CircleNotch,
  FloppyDisk,
  Plus,
  Trash,
  Info,
} from '@phosphor-icons/react'
import { getCommand, createCommand, updateCommand } from '@/api/client'
import { cn } from '@/lib/utils'
import type { CommandType, CommandCreate, CommandUpdate, RangeVariant } from '@/types/api'
import {
  COMMAND_TYPE_LABELS,
  COMMAND_TYPE_DESCRIPTIONS,
  TYPES_REQUIRING_VARIANTS,
} from '@/types/api'

const ALL_TYPES: CommandType[] = [
  'simple',
  'random_reply',
  'random_target',
  'random_target_action',
  'random_percent_target',
  'random_range',
]

export function CommandFormPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEdit = id !== undefined && id !== 'new'

  const [trigger, setTrigger] = useState('')
  const [type, setType] = useState<CommandType>('simple')
  const [response, setResponse] = useState('')
  const [stringVariants, setStringVariants] = useState<string[]>([''])
  const [rangeVariants, setRangeVariants] = useState<RangeVariant[]>([
    { min: 0, max: 10, text: '' },
  ])
  const [enabled, setEnabled] = useState(true)

  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(isEdit)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!isEdit) return
    setFetching(true)
    getCommand(Number(id))
      .then((cmd) => {
        setTrigger(cmd.trigger)
        setType(cmd.type)
        setResponse(cmd.response)
        setEnabled(cmd.enabled === 1)

        if (cmd.type === 'random_range' && Array.isArray(cmd.variants)) {
          setRangeVariants(cmd.variants as RangeVariant[])
        } else if (cmd.variants && Array.isArray(cmd.variants)) {
          setStringVariants(cmd.variants as string[])
        }
      })
      .catch(() => setError('Команда не найдена'))
      .finally(() => setFetching(false))
  }, [id, isEdit])

  const needsVariants = TYPES_REQUIRING_VARIANTS.includes(type)
  const isRange = type === 'random_range'

  function validate(): boolean {
    const errors: Record<string, string> = {}

    if (!trigger.trim()) {
      errors.trigger = 'Укажите триггер'
    } else if (!trigger.trim().startsWith('!')) {
      errors.trigger = 'Триггер должен начинаться с !'
    }

    if (!response.trim()) {
      errors.response = 'Укажите шаблон ответа'
    }

    if (needsVariants) {
      if (isRange) {
        const validRanges = rangeVariants.filter((r) => r.text.trim())
        if (validRanges.length === 0) {
          errors.variants = 'Добавьте хотя бы один диапазон с текстом'
        }
        rangeVariants.forEach((r, i) => {
          if (r.text.trim() && r.min > r.max && r.max !== 0) {
            errors[`range_${i}`] = 'min не может быть больше max'
          }
        })
      } else {
        const validVariants = stringVariants.filter((v) => v.trim())
        if (validVariants.length === 0) {
          errors.variants = 'Добавьте хотя бы один вариант'
        }
      }
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
        const data: CommandUpdate = {
          trigger: trigger.trim(),
          type,
          response: response.trim(),
          enabled,
        }

        if (needsVariants) {
          data.variants = isRange
            ? rangeVariants.filter((r) => r.text.trim())
            : stringVariants.filter((v) => v.trim())
        } else {
          data.variants = null
        }

        await updateCommand(Number(id), data)
      } else {
        const data: CommandCreate = {
          trigger: trigger.trim(),
          type,
          response: response.trim(),
          enabled,
        }

        if (needsVariants) {
          data.variants = isRange
            ? rangeVariants.filter((r) => r.text.trim())
            : stringVariants.filter((v) => v.trim())
        }

        await createCommand(data)
      }

      navigate('/', { replace: true })
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { status?: number; data?: { error?: string } } }
        if (axiosErr.response?.status === 409) {
          setError('Команда с таким триггером уже существует')
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
            {isEdit ? 'Редактировать команду' : 'Новая команда'}
          </h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Триггер */}
          <FieldGroup label="Триггер" error={fieldErrors.trigger}>
            <input
              type="text"
              value={trigger}
              onChange={(e) => {
                setTrigger(e.target.value)
                setFieldErrors((p) => ({ ...p, trigger: '' }))
              }}
              placeholder="!команда"
              className={cn(
                'w-full h-10 px-3 rounded-md bg-muted border text-sm font-mono',
                'placeholder:text-muted-foreground/50',
                'focus:outline-none focus:ring-2 focus:ring-ring',
                fieldErrors.trigger && 'border-destructive'
              )}
            />
          </FieldGroup>

          {/* Тип */}
          <FieldGroup label="Тип команды">
            <select
              value={type}
              onChange={(e) => setType(e.target.value as CommandType)}
              className="w-full h-10 px-3 rounded-md bg-muted border text-sm focus:outline-none focus:ring-2 focus:ring-ring appearance-none cursor-pointer"
            >
              {ALL_TYPES.map((t) => (
                <option key={t} value={t}>
                  {COMMAND_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
            <div className="flex items-start gap-1.5 mt-1.5 text-xs text-muted-foreground">
              <Info size={14} className="mt-0.5 shrink-0" />
              <span>{COMMAND_TYPE_DESCRIPTIONS[type]}</span>
            </div>
          </FieldGroup>

          {/* Ответ */}
          <FieldGroup label="Шаблон ответа" error={fieldErrors.response}>
            <textarea
              value={response}
              onChange={(e) => {
                setResponse(e.target.value)
                setFieldErrors((p) => ({ ...p, response: '' }))
              }}
              placeholder="@{user}, текст ответа"
              rows={3}
              className={cn(
                'w-full px-3 py-2 rounded-md bg-muted border text-sm',
                'placeholder:text-muted-foreground/50 resize-y',
                'focus:outline-none focus:ring-2 focus:ring-ring',
                fieldErrors.response && 'border-destructive'
              )}
            />
          </FieldGroup>

          {/* Варианты (строки) */}
          {needsVariants && !isRange && (
            <FieldGroup label="Варианты" error={fieldErrors.variants}>
              <div className="space-y-2">
                {stringVariants.map((v, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      type="text"
                      value={v}
                      onChange={(e) => {
                        const next = [...stringVariants]
                        next[i] = e.target.value
                        setStringVariants(next)
                        setFieldErrors((p) => ({ ...p, variants: '' }))
                      }}
                      placeholder={`Вариант ${i + 1}`}
                      className="flex-1 h-9 px-3 rounded-md bg-muted border text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    {stringVariants.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setStringVariants(stringVariants.filter((_, j) => j !== i))
                        }
                        className="p-2 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash size={14} />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setStringVariants([...stringVariants, ''])}
                  className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors"
                >
                  <Plus size={14} weight="bold" />
                  Добавить вариант
                </button>
              </div>
            </FieldGroup>
          )}

          {/* Варианты (диапазоны) */}
          {needsVariants && isRange && (
            <FieldGroup label="Диапазоны" error={fieldErrors.variants}>
              <div className="space-y-3">
                {rangeVariants.map((r, i) => (
                  <div key={i} className="space-y-2 bg-muted/50 border rounded-md p-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">Min</label>
                          <input
                            type="number"
                            value={r.min}
                            onChange={(e) => {
                              const next = [...rangeVariants]
                              next[i] = { ...r, min: Number(e.target.value) }
                              setRangeVariants(next)
                            }}
                            className="w-full h-8 px-2 rounded-md bg-muted border text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">Max</label>
                          <input
                            type="number"
                            value={r.max}
                            onChange={(e) => {
                              const next = [...rangeVariants]
                              next[i] = { ...r, max: Number(e.target.value) }
                              setRangeVariants(next)
                            }}
                            className="w-full h-8 px-2 rounded-md bg-muted border text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
                          />
                        </div>
                      </div>
                      {rangeVariants.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            setRangeVariants(rangeVariants.filter((_, j) => j !== i))
                          }
                          className="p-2 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors mt-4"
                        >
                          <Trash size={14} />
                        </button>
                      )}
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">
                        Текст (плейсхолдер: {'{size}'})
                      </label>
                      <input
                        type="text"
                        value={r.text}
                        onChange={(e) => {
                          const next = [...rangeVariants]
                          next[i] = { ...r, text: e.target.value }
                          setRangeVariants(next)
                          setFieldErrors((p) => ({ ...p, variants: '' }))
                        }}
                        placeholder="{size}см текст"
                        className="w-full h-8 px-2 rounded-md bg-muted border text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    {fieldErrors[`range_${i}`] && (
                      <p className="text-xs text-destructive">{fieldErrors[`range_${i}`]}</p>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    setRangeVariants([...rangeVariants, { min: 0, max: 10, text: '' }])
                  }
                  className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors"
                >
                  <Plus size={14} weight="bold" />
                  Добавить диапазон
                </button>
              </div>
            </FieldGroup>
          )}

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
              <span className="text-sm">{enabled ? 'Активна' : 'Отключена'}</span>
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
