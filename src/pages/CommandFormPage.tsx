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
    <div className="min-h-[100dvh] bg-background text-white pb-20">
      <header className="fixed top-0 left-0 right-0 z-50 px-4 py-4 pointer-events-none">
        <div className="max-w-2xl mx-auto flex items-center gap-3 pointer-events-auto">
          <button
            onClick={() => navigate(-1)}
            className="glass w-11 h-11 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors text-white/70"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="glass px-4 h-11 rounded-full flex items-center gap-3">
            <CommandIcon size={20} className="text-white" weight="duotone" />
            <span className="font-bold text-xs tracking-tight uppercase">
              {isEdit ? 'Редактировать' : 'Создать'}
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
          {/* Триггер */}
          <FieldGroup label="Триггер" error={fieldErrors.trigger}>
            <div className="double-bezel">
              <input
                type="text"
                value={trigger}
                onChange={(e) => setTrigger(e.target.value)}
                placeholder="!команда"
                className="w-full h-11 px-4 double-bezel-inner text-sm font-mono focus:outline-none focus:ring-1 focus:ring-white/20"
              />
            </div>
          </FieldGroup>

          {/* Тип */}
          <FieldGroup label="Тип команды">
            <div className="double-bezel">
              <select
                value={type}
                onChange={(e) => setType(e.target.value as CommandType)}
                className="w-full h-11 px-4 double-bezel-inner text-sm focus:outline-none focus:ring-1 focus:ring-white/20 appearance-none cursor-pointer"
              >
                {ALL_TYPES.map((t) => (
                  <option key={t} value={t} className="bg-black">
                    {COMMAND_TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-start gap-2 mt-2 px-1">
              <Info size={14} className="mt-0.5 text-white/30" />
              <p className="text-[11px] text-white/40 leading-relaxed">{COMMAND_TYPE_DESCRIPTIONS[type]}</p>
            </div>
          </FieldGroup>

          {/* Ответ */}
          <FieldGroup label="Шаблон ответа" error={fieldErrors.response}>
            <div className="double-bezel">
              <textarea
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                placeholder="@{user}, текст ответа"
                rows={4}
                className="w-full px-4 py-3 double-bezel-inner text-sm focus:outline-none focus:ring-1 focus:ring-white/20 resize-none"
              />
            </div>
          </FieldGroup>

          {/* Варианты */}
          {needsVariants && (
            <FieldGroup label={isRange ? 'Диапазоны' : 'Варианты'} error={fieldErrors.variants}>
              <div className="space-y-3">
                {isRange ? (
                  rangeVariants.map((r, i) => (
                    <div key={i} className="double-bezel">
                      <div className="double-bezel-inner p-4 space-y-3">
                        <div className="flex gap-2">
                          <input
                            type="number"
                            value={r.min}
                            onChange={(e) => {
                              const next = [...rangeVariants]
                              next[i] = { ...r, min: Number(e.target.value) }
                              setRangeVariants(next)
                            }}
                            placeholder="Min"
                            className="w-full h-9 px-3 rounded-lg bg-white/5 border border-white/5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-white/20"
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
                            className="w-full h-9 px-3 rounded-lg bg-white/5 border border-white/5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-white/20"
                          />
                          {rangeVariants.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setRangeVariants(rangeVariants.filter((_, j) => j !== i))}
                              className="w-9 h-9 shrink-0 rounded-lg bg-white/5 flex items-center justify-center text-white/20 hover:text-destructive transition-colors"
                            >
                              <Trash size={14} />
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
                          className="w-full h-9 px-3 rounded-lg bg-white/5 border border-white/5 text-xs focus:outline-none focus:ring-1 focus:ring-white/20"
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  stringVariants.map((v, i) => (
                    <div key={i} className="flex gap-2">
                      <div className="double-bezel flex-1">
                        <input
                          type="text"
                          value={v}
                          onChange={(e) => {
                            const next = [...stringVariants]
                            next[i] = e.target.value
                            setStringVariants(next)
                          }}
                          placeholder={`Вариант ${i + 1}`}
                          className="w-full h-10 px-4 double-bezel-inner text-sm focus:outline-none focus:ring-1 focus:ring-white/20"
                        />
                      </div>
                      {stringVariants.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setStringVariants(stringVariants.filter((_, j) => j !== i))}
                          className="w-10 h-11 flex items-center justify-center rounded-xl bg-white/5 text-white/20 hover:text-destructive transition-colors"
                        >
                          <Trash size={16} />
                        </button>
                      )}
                    </div>
                  ))
                )}
                <button
                  type="button"
                  onClick={() => isRange ? setRangeVariants([...rangeVariants, { min: 0, max: 10, text: '' }]) : setStringVariants([...stringVariants, ''])}
                  className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/30 hover:text-white transition-colors px-1"
                >
                  <Plus size={14} weight="bold" />
                  Добавить {isRange ? 'диапазон' : 'вариант'}
                </button>
              </div>
            </FieldGroup>
          )}

          {/* Статус */}
          <div className="flex items-center justify-between p-6 double-bezel">
             <div className="double-bezel-inner w-full flex items-center justify-between p-4">
                <div className="space-y-0.5">
                  <p className="text-sm font-bold">Активность команды</p>
                  <p className="text-[11px] text-white/30">Команда будет доступна в чате</p>
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
