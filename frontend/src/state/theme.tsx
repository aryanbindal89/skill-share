import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

type Theme = 'dark' | 'light'
const ThemeContext = createContext<{ theme: Theme; toggle: () => void } | null>(null)
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => document.documentElement.dataset.theme === 'light' ? 'light' : 'dark')
  const toggle = () => setTheme((old) => {
    const next = old === 'dark' ? 'light' : 'dark'
    document.documentElement.dataset.theme = next
    localStorage.setItem('skillshare-theme', next)
    return next
  })
  return <ThemeContext.Provider value={useMemo(() => ({ theme, toggle }), [theme])}>{children}</ThemeContext.Provider>
}
export function useTheme() { const value = useContext(ThemeContext); if (!value) throw new Error('useTheme must be inside ThemeProvider'); return value }
