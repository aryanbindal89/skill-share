import { useEffect, useState, type ReactNode } from 'react'
import { Link, NavLink, Navigate, Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowUpRight, Bell, BookOpen, Compass, GraduationCap, House, Layers3, LogOut, Menu, Moon, Search, Sun, UsersRound, X } from 'lucide-react'
import { useAuth } from '../state/auth'
import { useTheme } from '../state/theme'
import { useToast } from '../state/toast'

export function Brand({ small = false }: { small?: boolean }) {
  return <Link to="/" className={`brand ${small ? 'brand-small' : ''}`} aria-label="SkillShare home"><span className="brand-symbol">s<span>.</span></span><span className="brand-word">skillshare<span className="brand-dot">.</span></span></Link>
}

export function ThemeToggle() {
  const { theme, toggle } = useTheme()
  return <button className="icon-button theme-toggle" onClick={toggle} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}>{theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}</button>
}

const primaryLinks = [
  { to: '/dashboard', label: 'Home', icon: House },
  { to: '/explore', label: 'Explore skills', icon: Compass },
  { to: '/students', label: 'Find a learner', icon: UsersRound },
  { to: '/sessions', label: 'Sessions', icon: Bell },
]
const learningLinks = [
  { to: '/roadmaps/new', label: 'Learning plan', icon: Layers3 },
  { to: '/progress', label: 'Progress', icon: GraduationCap },
]

export function PublicHeader() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  return <header className="public-header"><div className="public-header-inner"><Brand /><nav className={`public-links ${open ? 'open' : ''}`} aria-label="Main navigation"><Link to="/" onClick={() => setOpen(false)}>Home</Link><a href="/#how" onClick={() => setOpen(false)}>How it works</a><Link to="/explore" onClick={() => setOpen(false)}>Explore skills</Link><Link to="/students" onClick={() => setOpen(false)}>Find a learner</Link><Link to="/about" onClick={() => setOpen(false)}>About us</Link></nav><div className="header-actions"><ThemeToggle />{user ? <Link className="button button-small button-primary" to="/dashboard">My learning space <ArrowUpRight size={15} /></Link> : <><Link className="button button-small button-ghost login-link" to="/login">Log in</Link><Link className="button button-small button-primary" to="/register">Create account <ArrowUpRight size={15} /></Link></>}<button className="mobile-menu icon-button" onClick={() => setOpen((x) => !x)} aria-label={open ? 'Close navigation' : 'Open navigation'}>{open ? <X size={19} /> : <Menu size={19} />}</button></div></div></header>
}

export function PublicCatalogShell() {
  const { user } = useAuth()
  if (user) return <ProductShell />
  return <div className="public-catalog-shell"><PublicHeader /><main className="public-catalog-main"><Outlet /></main><footer className="marketing-footer"><Brand small /><span>Learn together. Grow together.</span><div><Link to="/about">About</Link><Link to="/">Home</Link><Link to="/explore">Explore</Link></div><small>© 2026 HACKER_RUN</small></footer></div>
}

export function ProductShell() {
  const { user, logout } = useAuth()
  const toast = useToast()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  useEffect(() => setMobileOpen(false), [location.pathname])
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />
  const handleLogout = async () => { await logout(); toast('You’re signed out.'); }
  return <div className="product-shell">
    <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
      <div className="sidebar-brand"><Brand /><button className="mobile-menu icon-button" onClick={() => setMobileOpen(false)} aria-label="Close menu"><X size={18} /></button></div>
      <nav className="side-nav" aria-label="Workspace navigation">
        <div className="sidebar-label">START HERE</div>
        {primaryLinks.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} className={({ isActive }) => `side-link ${isActive ? 'active' : ''}`}><Icon size={17} strokeWidth={1.8} /><span>{label}</span></NavLink>)}
        <div className="sidebar-label sidebar-label-secondary">YOUR LEARNING</div>
        {learningLinks.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} className={({ isActive }) => `side-link ${isActive || (to === '/roadmaps/new' && location.pathname.startsWith('/roadmaps/')) ? 'active' : ''}`}><Icon size={17} strokeWidth={1.8} /><span>{label}</span></NavLink>)}
      </nav>
      <div className="sidebar-spacer" />
      <div className="sidebar-tip"><div className="tip-orbit"><BookOpen size={18} /></div><p>Small steps make<br />big things happen.</p><span>Your next chapter starts today.</span></div>
      <div className="sidebar-user"><div className="avatar avatar-sm">{(user.username[0] || 'S').toUpperCase()}</div><div className="sidebar-user-text"><strong>{user.username}</strong><span>Learning member</span></div><button className="icon-button logout-button" onClick={handleLogout} title="Sign out" aria-label="Sign out"><LogOut size={16} /></button></div>
    </aside>
    {mobileOpen && <button className="sidebar-scrim" onClick={() => setMobileOpen(false)} aria-label="Close navigation" />}
    <div className="main-column"><header className="app-header"><button className="mobile-menu icon-button" onClick={() => setMobileOpen(true)} aria-label="Open navigation"><Menu size={19} /></button><div className="app-crumb"><span>My space</span><span className="crumb-slash">/</span><strong>{[...primaryLinks, ...learningLinks].find((item) => item.to === location.pathname)?.label || (location.pathname.startsWith('/profile') ? 'Your profile' : location.pathname.startsWith('/roadmaps/') ? 'Your learning plan' : location.pathname.startsWith('/students/') ? 'Learner profile' : location.pathname.startsWith('/requests') ? 'Sessions' : 'SkillShare')}</strong></div><div className="app-header-actions"><Link to="/explore" className="quick-search" aria-label="Browse skills"><Search size={15} /><span>Find a skill</span></Link><ThemeToggle /><Link to="/profile" className="avatar avatar-button" aria-label="Open your profile and settings" title="Profile and settings">{(user.username[0] || 'S').toUpperCase()}</Link></div></header><main className="product-main"><Outlet /></main><footer className="app-footer"><span>Make learning a team sport.</span><Link to="/about">About SkillShare <ArrowUpRight size={13} /></Link></footer></div>
    <nav className="mobile-tabbar" aria-label="Quick navigation">
      <NavLink to="/dashboard" end className={({ isActive }) => `mobile-tab ${isActive ? 'active' : ''}`}><House size={19} /><span>Home</span></NavLink>
      <NavLink to="/explore" className={({ isActive }) => `mobile-tab ${isActive ? 'active' : ''}`}><Compass size={19} /><span>Explore</span></NavLink>
      <NavLink to="/students" className={({ isActive }) => `mobile-tab ${isActive ? 'active' : ''}`}><UsersRound size={19} /><span>People</span></NavLink>
      <NavLink to="/sessions" className={({ isActive }) => `mobile-tab ${isActive ? 'active' : ''}`}><Bell size={19} /><span>Sessions</span></NavLink>
    </nav>
  </div>
}

export function PageMotion({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <motion.div className={className} initial={{ opacity: 0, y: 9 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.22, ease: 'easeOut' }}>{children}</motion.div>
}

export function RequireAuth() { return <ProductShell /> }

export function Panel({ children, className = '' }: { children: ReactNode; className?: string }) { return <section className={`panel ${className}`}>{children}</section> }
export function PageHeading({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return <div className="page-heading"><div>{eyebrow && <div className="eyebrow">{eyebrow}</div>}<h1>{title}</h1>{description && <p>{description}</p>}</div>{action && <div className="page-heading-action">{action}</div>}</div>
}
export function Button({ children, variant = 'primary', className = '', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger' }) {
  return <button className={`button button-${variant} ${className}`} {...props}>{children}</button>
}
export function EmptyState({ icon: Icon = GraduationCap, title, description, action }: { icon?: typeof GraduationCap; title: string; description: string; action?: ReactNode }) {
  return <div className="empty-state"><div className="empty-icon"><Icon size={21} /></div><h3>{title}</h3><p>{description}</p>{action}</div>
}
export function Loading({ label = 'Loading your space…' }: { label?: string }) { return <div className="loading-state"><span className="spinner" /><span>{label}</span></div> }
export function useReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => { const media = matchMedia('(prefers-reduced-motion: reduce)'); setReduced(media.matches); const update = () => setReduced(media.matches); media.addEventListener('change', update); return () => media.removeEventListener('change', update) }, [])
  return reduced
}
export function pageError(error: unknown) { return error instanceof Error ? error.message : 'Something went wrong. Please try again.' }
export function formatDate(value: string, withTime = false) { return new Intl.DateTimeFormat(undefined, withTime ? { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' } : { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value)) }
export function shortDate(value: string) { return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(value)) }
export function TextLink({ to, children }: { to: string; children: ReactNode }) { return <Link className="text-link" to={to}>{children}<ArrowUpRight size={14} /></Link> }
