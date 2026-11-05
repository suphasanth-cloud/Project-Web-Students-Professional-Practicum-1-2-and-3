import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { api } from '../lib/api'
import type { UserProfile } from '../types'

interface AuthContextType {
  session: boolean
  profile: UserProfile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string, extra?: Record<string, unknown>) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<boolean>(false)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = async () => {
    try {
      const res = await api.get<{ user: UserProfile }>('/me.php')
      setProfile(res.user)
      return res.user
    } catch {
      api.clearToken()
      setProfile(null)
      return null
    }
  }

  const refreshProfile = async () => {
    await fetchProfile()
  }

  useEffect(() => {
    const init = async () => {
      if (api.token()) {
        setSession(true)
        await fetchProfile()
      }
      setLoading(false)
    }
    init()
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      const res = await api.post<{ token: string; user: UserProfile }>('/login.php', { email, password })
      api.setToken(res.token)
      setSession(true)
      setProfile(res.user)
      return { error: null }
    } catch (err) {
      return { error: (err as Error).message }
    }
  }

  const signUp = async (email: string, password: string, extra?: Record<string, unknown>) => {
    try {
      await api.post('/register.php', { email, password, ...extra })
      return { error: null }
    } catch (err) {
      return { error: (err as Error).message }
    }
  }

  const signOut = async () => {
    try {
      await api.post('/logout.php')
    } catch {
      // ignore
    }
    api.clearToken()
    setSession(false)
    setProfile(null)
  }

  return (
    <AuthContext.Provider value={{ session, profile, loading, signIn, signUp, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
