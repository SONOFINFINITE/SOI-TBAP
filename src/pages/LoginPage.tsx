import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { SignIn, Eye, EyeSlash, CircleNotch } from '@phosphor-icons/react'
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
    if (!isValid) return

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
        } else if (axiosErr.response?.status === 400) {
          setError('Заполните все поля')
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

  return (
    <div className="min-h-dvh flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 mb-4">
            <SignIn size={24} className="text-primary" weight="bold" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Twitch Bot Admin</h1>
          <p className="text-sm text-muted-foreground mt-1">Войдите, чтобы управлять ботом</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="username" className="text-sm font-medium">
              Логин
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Введите логин"
              autoComplete="username"
              autoFocus
              disabled={loading}
              className={cn(
                'w-full h-10 px-3 rounded-md bg-muted border text-sm',
                'placeholder:text-muted-foreground/50',
                'focus:outline-none focus:ring-2 focus:ring-ring',
                'disabled:opacity-50'
              )}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="text-sm font-medium">
              Пароль
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Введите пароль"
                autoComplete="current-password"
                disabled={loading}
                className={cn(
                  'w-full h-10 px-3 pr-10 rounded-md bg-muted border text-sm',
                  'placeholder:text-muted-foreground/50',
                  'focus:outline-none focus:ring-2 focus:ring-ring',
                  'disabled:opacity-50'
                )}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
                aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
              >
                {showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={!isValid || loading}
            className={cn(
              'w-full h-10 rounded-md bg-primary text-primary-foreground text-sm font-medium',
              'hover:bg-primary/90 transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'flex items-center justify-center gap-2'
            )}
          >
            {loading ? (
              <CircleNotch size={18} className="animate-spin" />
            ) : (
              <SignIn size={18} weight="bold" />
            )}
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>
      </div>
    </div>
  )
}
