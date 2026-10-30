import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { authApi, type User } from '../lib/api'

type AuthState = { user: User | null; loading: boolean; login: (name: string, password: string) => Promise<void>; register: (name: string, email: string, password: string) => Promise<void>; logout: () => Promise<void>; refresh: () => Promise<void> }
const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const refresh = async () => { try { setUser(await authApi.me()) } catch { setUser(null) } finally { setLoading(false) } }
  useEffect(() => { void refresh() }, [])
  const value = useMemo<AuthState>(() => ({
    user, loading, refresh,
    login: async (name, password) => { setUser(await authApi.login(name, password)) },
    register: async (name, email, password) => { setUser(await authApi.register(name, email, password)) },
    logout: async () => { await authApi.logout(); setUser(null) },
  }), [user, loading])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
export function useAuth() { const value = useContext(AuthContext); if (!value) throw new Error('useAuth must be inside AuthProvider'); return value }
