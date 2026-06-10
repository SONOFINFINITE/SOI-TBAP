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
      {/* Background Anime Blobs */}
      <motion.div 
        animate={{ scale: [1, 1.05, 1], rotate: [0, 5, 0] }} 
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/4 -left-1/4 w-[800px] h-[800px] bg-primary/20 blur-[120px] rounded-full pointer-events-none" 
      />
      <motion.div 
        animate={{ scale: [1, 1.1, 1], rotate: [0, -5, 0] }} 
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-1/4 -right-1/4 w-[600px] h-[600px] bg-blue-200/40 blur-[120px] rounded-full pointer-events-none" 
      />
      
      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-sm z-10"
      >
        <div className="text-center mb-10">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white shadow-xl mb-6 border border-border"
          >
            <Robot size={40} className="text-primary" weight="duotone" />
          </motion.div>
          <h1 className="text-4xl font-serif text-foreground mb-3">Вход в систему</h1>
          <p className="text-base text-muted-foreground">Управление Twitch-ботом</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="username" className="text-sm font-medium text-foreground ml-1">
              Логин
            </label>
            <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden focus-within:ring-2 focus-within:ring-primary/50 transition-shadow">
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ваш username"
                autoComplete="username"
                autoFocus
                disabled={loading}
                className="w-full h-14 px-5 text-base focus:outline-none bg-transparent placeholder:text-muted-foreground/50"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-foreground ml-1">
              Пароль
            </label>
            <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden focus-within:ring-2 focus-within:ring-primary/50 transition-shadow relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                disabled={loading}
                className="w-full h-14 px-5 pr-14 text-base focus:outline-none bg-transparent placeholder:text-muted-foreground/50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted"
                tabIndex={-1}
              >
                {showPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="text-sm text-destructive bg-destructive/5 border border-destructive/20 rounded-xl px-5 py-3 text-center"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={!isValid || loading}
            className={cn(
              'w-full h-14 rounded-full bg-foreground text-background text-base font-bold shadow-lg',
              'hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300',
              'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-lg',
              'flex items-center justify-center gap-3 group mt-8'
            )}
          >
            {loading ? (
              <CircleNotch size={24} className="animate-spin" />
            ) : (
              <>
                <span>Продолжить</span>
                <SignIn size={20} weight="bold" className="transition-transform group-hover:translate-x-1" />
              </>
            )}
          </motion.button>
        </form>
      </motion.div>
    </div>
  )
}
