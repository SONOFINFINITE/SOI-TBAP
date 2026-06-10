import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'motion/react'
import {
  ArrowLeft,
  CircleNotch,
  FloppyDisk,
  Plus,
  Trash,
  Info,
  Command as CommandIcon,
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

      if (isEdit) {
        await updateCommand(Number(id), data)
      } else {
        await createCommand(data as CommandCreate)
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
              <CommandIcon size={24} className="text-primary" weight="duotone" />
            </div>
            <span className="font-serif font-bold text-xl tracking-tight">
              {isEdit ? 'Редактировать команду' : 'Новая команда'}
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
          {/* Триггер */}
          <FieldGroup label="Триггер" error={fieldErrors.trigger}>
            <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden focus-within:ring-2 focus-within:ring-primary/50 transition-shadow">
              <input
                type="text"
                value={trigger}
                onChange={(e) => setTrigger(e.target.value)}
                placeholder="!команда"
                className="w-full h-14 px-5 text-base font-mono focus:outline-none bg-transparent placeholder:text-muted-foreground/50"
              />
            </div>
          </FieldGroup>

          {/* Тип */}
          <FieldGroup label="Тип команды">
            <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden focus-within:ring-2 focus-within:ring-primary/50 transition-shadow">
              <select
                value={type}
                onChange={(e) => setType(e.target.value as CommandType)}
                className="w-full h-14 px-5 text-base focus:outline-none bg-transparent appearance-none cursor-pointer"
              >
                {ALL_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {COMMAND_TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-start gap-2 mt-3 px-2">
              <Info size={16} className="mt-0.5 text-primary shrink-0" />
              <p className="text-sm text-muted-foreground leading-relaxed">{COMMAND_TYPE_DESCRIPTIONS[type]}</p>
            </div>
          </FieldGroup>

          {/* Ответ */}
          <FieldGroup label="Шаблон ответа" error={fieldErrors.response}>
            <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden focus-within:ring-2 focus-within:ring-primary/50 transition-shadow">
              <textarea
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                placeholder="@{user}, текст ответа"
                rows={5}
                className="w-full p-5 text-base focus:outline-none bg-transparent resize-none placeholder:text-muted-foreground/50"
              />
            </div>
          </FieldGroup>

          {/* Варианты */}
          {needsVariants && (
            <FieldGroup label={isRange ? 'Диапазоны' : 'Варианты'} error={fieldErrors.variants}>
              <div className="space-y-4">
                {isRange ? (
                  rangeVariants.map((r, i) => (
                    <div key={i} className="paper-card p-5 space-y-4">
                      <div className="flex gap-3">
                        <input
                          type="number"
                          value={r.min}
                          onChange={(e) => {
                            const next = [...rangeVariants]
                            next[i] = { ...r, min: Number(e.target.value) }
                            setRangeVariants(next)
                          }}
                          placeholder="Min"
                          className="w-full h-12 px-4 rounded-xl bg-muted border border-border text-base font-mono focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                        <input
                          type="number"
                          value={r.max}
                          onChange={(e) => {
                            const next = [...rangeVariants]
                            next[i] = { ...r, max: Number(e.target.value) }
                            setRangeVariants(next)
                          }}
                          placeholder="Max"
                          className="w-full h-12 px-4 rounded-xl bg-muted border border-border text-base font-mono focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                        {rangeVariants.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setRangeVariants(rangeVariants.filter((_, j) => j !== i))}
                            className="w-12 h-12 shrink-0 rounded-xl bg-white border border-border flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors shadow-sm"
                          >
                            <Trash size={18} />
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        value={r.text}
                        onChange={(e) => {
                          const next = [...rangeVariants]
                          next[i] = { ...r, text: e.target.value }
                          setRangeVariants(next)
                        }}
                        placeholder="Текст для этого диапазона"
                        className="w-full h-12 px-4 rounded-xl bg-muted border border-border text-base focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                  ))
                ) : (
                  stringVariants.map((v, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden focus-within:ring-2 focus-within:ring-primary/50 transition-shadow flex-1">
                        <input
                          type="text"
                          value={v}
                          onChange={(e) => {
                            const next = [...stringVariants]
                            next[i] = e.target.value
                            setStringVariants(next)
                          }}
                          placeholder={`Вариант ${i + 1}`}
                          className="w-full h-14 px-5 text-base focus:outline-none bg-transparent placeholder:text-muted-foreground/50"
                        />
                      </div>
                      {stringVariants.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setStringVariants(stringVariants.filter((_, j) => j !== i))}
                          className="w-14 h-14 flex items-center justify-center rounded-2xl bg-white border border-border shadow-sm text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors"
                        >
                          <Trash size={20} />
                        </button>
                      )}
                    </div>
                  ))
                )}
                <button
                  type="button"
                  onClick={() => isRange ? setRangeVariants([...rangeVariants, { min: 0, max: 10, text: '' }]) : setStringVariants([...stringVariants, ''])}
                  className="flex items-center justify-center gap-2 w-full h-14 rounded-2xl bg-accent text-primary font-bold text-base hover:bg-primary/20 transition-colors shadow-sm"
                >
                  <Plus size={18} weight="bold" />
                  Добавить {isRange ? 'диапазон' : 'вариант'}
                </button>
              </div>
            </FieldGroup>
          )}

          {/* Статус */}
          <div className="paper-card p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-base font-bold text-foreground">Активность команды</p>
              <p className="text-sm text-muted-foreground">Команда будет доступна в чате</p>
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
