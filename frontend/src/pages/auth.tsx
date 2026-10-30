import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Eye, EyeOff, LockKeyhole, Mail, Sparkles, UserRound } from 'lucide-react'
import { Brand, Button, PageMotion, PublicHeader, pageError } from '../components/ui'
import { useAuth } from '../state/auth'

export default function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const { user, login, register } = useAuth()
  const isSignup = mode === 'register'
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  if (user) return <Navigate to="/dashboard" replace />
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError('')
    if (isSignup && password !== confirm) { setError('Your passwords do not match yet.'); return }
    setBusy(true)
    try {
      if (isSignup) { await register(username.trim(), email.trim(), password); navigate('/setup', { replace: true }) }
      else { await login(username.trim(), password); const next = params.get('next'); navigate(next?.startsWith('/') && !next.startsWith('//') ? next : '/dashboard', { replace: true }) }
    } catch (err) { setError(pageError(err)) } finally { setBusy(false) }
  }
  return <div className="auth-page"><div className="auth-ambient" aria-hidden="true"><span className="auth-ambient-blob auth-ambient-blob-one" /><span className="auth-ambient-blob auth-ambient-blob-two" /><span className="auth-ambient-grid" /></div><PublicHeader /><main className="auth-layout"><section className="auth-aside"><div className="auth-aside-art"><span className="auth-orbit ao1" /><span className="auth-orbit ao2" /><span className="auth-spark asp1">✳</span><span className="auth-spark asp2">✦</span><span className="auth-glass-card gc1"><BookOpenMini /></span><span className="auth-glass-card gc2"><Sparkles size={17} /></span><span className="auth-main-gem">s.</span><span className="auth-orbit-dot ad1" /><span className="auth-orbit-dot ad2" /></div><div className="auth-aside-copy"><span className="eyebrow">A PLACE TO GROW, TOGETHER</span><h2>There is so much<br />you can <em>learn from each other.</em></h2><p>Bring what you know. Ask what you wonder. Your next chapter starts with a conversation.</p></div><div className="auth-aside-meta"><span>01 / 03</span><span className="meta-divider" /><span>PEER LEARNING · REAL PROGRESS</span></div></section>
    <section className="auth-form-side"><div className="auth-mobile-brand"><Brand /></div><Link to="/" className="back-home"><ArrowLeft size={15} /> Back to home</Link><div className="auth-form-wrap"><div className="auth-form-kicker"><span className="auth-kicker-mark"><Sparkles size={14} /></span>{isSignup ? 'START SOMETHING GOOD' : 'WELCOME BACK'}</div><h1>{isSignup ? 'Find your people.' : 'Good to see you.'}</h1><p className="auth-intro">{isSignup ? 'Create your free account and find a new way to learn.' : 'Sign in to pick up right where your curiosity left off.'}</p><form onSubmit={submit} className="auth-form">
      <label>{isSignup ? 'Username' : 'Username or email'}<div className="input-wrap"><UserRound size={17} /><input value={username} onChange={(e) => setUsername(e.target.value)} placeholder={isSignup ? 'e.g. alexlearns' : 'Your username or email'} autoComplete={isSignup ? 'username' : 'username'} required minLength={isSignup ? 3 : undefined} /></div></label>
      {isSignup && <label>Email address<div className="input-wrap"><Mail size={17} /><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" required /></div></label>}
      <label>Password<div className="input-wrap"><LockKeyhole size={17} /><input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder={isSignup ? 'At least 8 characters' : 'Your password'} autoComplete={isSignup ? 'new-password' : 'current-password'} required minLength={isSignup ? 8 : undefined} /><button className="password-reveal" type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></div></label>
      {isSignup && <label>Confirm password<div className="input-wrap"><LockKeyhole size={17} /><input type={showPassword ? 'text' : 'password'} value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Type it one more time" autoComplete="new-password" required minLength={8} /></div></label>}
      {error && <div className="form-error" role="alert">{error}</div>}
      <Button className="auth-submit" type="submit" disabled={busy}>{busy ? <><span className="spinner spinner-small" />{isSignup ? 'Creating your space…' : 'Signing you in…'}</> : <>{isSignup ? 'Create my account' : 'Sign in'} <ArrowRight size={16} /></>}</Button>
    </form><p className="auth-switch">{isSignup ? 'Already part of the community?' : 'New around here?'} <Link to={isSignup ? '/login' : '/register'}>{isSignup ? 'Sign in' : 'Create an account'}</Link></p><div className="auth-secure-note"><span className="secure-dot" /> Your learning space belongs to you. Your password is always protected.</div></div></section></main></div>
}

function BookOpenMini() { return <span className="book-mini">↗</span> }
