import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { SignIn, Eye, EyeSlash, CircleNotch, Robot } from '@phosphor-icons/react'
import { motion, AnimatePresence } from 'motion/react'
import { login } from '@/api/client'
import { useAuthStore } from '@/store/auth'
import { cn } from '@/lib/utils'

export function LoginPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const isValid = username.trim().length > 0 && password.length > 0

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!isValid || loading) return

    setError('')
    setLoading(true)

    try {
      const data = await login({ username: username.trim(), password })
      setAuth(data.token, data.admin)
      navigate('/', { replace: true })
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { status?: number; data?: { error?: string } } }
        if (axiosErr.response?.status === 401) {
          setError('Неверный логин или пароль')
        } else {
          setError(axiosErr.response?.data?.error || 'Ошибка соединения с сервером')
        }
      } else {
        setError('Нет соединения с сервером')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[100dvh] flex items-center justify-center px-4 bg-background relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm z-10"
      >
        <div className="text-center mb-10">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/5 ring-1 ring-white/10 mb-6 shadow-2xl"
          >
            <Robot size={32} className="text-white" weight="duotone" />
          </motion.div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Вход в систему</h1>
          <p className="text-sm text-muted-foreground">Управление Twitch-ботом в реальном времени</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="username" className="text-[11px] uppercase tracking-[0.2em] font-medium text-muted-foreground ml-1">
              Логин
            </label>
            <div className="double-bezel group">
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                autoComplete="username"
                autoFocus
                disabled={loading}
                className="w-full h-11 px-4 double-bezel-inner text-sm focus:outline-none focus:ring-1 focus:ring-white/20 transition-all placeholder:text-muted-foreground/30"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-[11px] uppercase tracking-[0.2em] font-medium text-muted-foreground ml-1">
              Пароль
            </label>
            <div className="double-bezel group">
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  disabled={loading}
                  className="w-full h-11 px-4 pr-12 double-bezel-inner text-sm focus:outline-none focus:ring-1 focus:ring-white/20 transition-all placeholder:text-muted-foreground/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-white transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="text-xs text-destructive bg-destructive/5 border border-destructive/10 rounded-lg px-4 py-3 text-center"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={!isValid || loading}
            className={cn(
              'w-full h-12 rounded-xl bg-white text-black text-sm font-bold shadow-xl shadow-white/5',
              'hover:bg-white/90 transition-all duration-300',
              'disabled:opacity-20 disabled:cursor-not-allowed disabled:grayscale',
              'flex items-center justify-center gap-2 group'
            )}
          >
            {loading ? (
              <CircleNotch size={20} className="animate-spin" />
            ) : (
              <>
                <span>Войти</span>
                <div className="w-6 h-6 rounded-full bg-black/5 flex items-center justify-center transition-transform group-hover:translate-x-1">
                  <SignIn size={14} weight="bold" />
                </div>
              </>
            )}
          </motion.button>
        </form>
      </motion.div>
    </div>
  )
}
