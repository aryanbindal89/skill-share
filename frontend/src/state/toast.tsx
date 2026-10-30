import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, CircleAlert, X } from 'lucide-react'

type Toast = { id: number; text: string; kind: 'success' | 'error' }
const ToastContext = createContext<(text: string, kind?: Toast['kind']) => void>(() => {})
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([])
  const push = (text: string, kind: Toast['kind'] = 'success') => {
    const id = Date.now() + Math.random()
    setItems((old) => [...old, { id, text, kind }])
    window.setTimeout(() => setItems((old) => old.filter((toast) => toast.id !== id)), 3800)
  }
  const dismiss = (id: number) => setItems((old) => old.filter((toast) => toast.id !== id))
  return <ToastContext.Provider value={useMemo(() => push, [])}>{children}<div className="toast-stack" aria-live="polite"><AnimatePresence>{items.map((toast) => <motion.div layout initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }} className={`toast ${toast.kind}`} key={toast.id}><span className="toast-icon">{toast.kind === 'success' ? <Check size={16} /> : <CircleAlert size={16} />}</span><span>{toast.text}</span><button aria-label="Dismiss notification" onClick={() => dismiss(toast.id)}><X size={15} /></button></motion.div>)}</AnimatePresence></div></ToastContext.Provider>
}
export function useToast() { return useContext(ToastContext) }
