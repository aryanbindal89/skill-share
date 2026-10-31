import { lazy, Suspense, useEffect, useRef } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { MobileNavigationProvider, ProductShell, PublicCatalogShell, Loading, PageMotion } from './components/ui'

const Landing = lazy(() => import('./pages/landing'))
const AuthPage = lazy(() => import('./pages/auth'))
const SetupPage = lazy(() => import('./pages/setup'))
const DashboardPage = lazy(() => import('./pages/dashboard'))
const ExplorePage = lazy(() => import('./pages/explore'))
const StudentsPage = lazy(() => import('./pages/students'))
const StudentPage = lazy(() => import('./pages/student'))
const RoadmapPage = lazy(() => import('./pages/roadmaps'))
const SessionsPage = lazy(() => import('./pages/sessions'))
const ProgressPage = lazy(() => import('./pages/progress'))
const ProfilePage = lazy(() => import('./pages/profile'))
const AboutPage = lazy(() => import('./pages/about'))

function ScrollReset() {
  const location = useLocation()
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }) }, [location.pathname])
  return null
}

function SiteCursor() {
  const cursorRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const cursor = cursorRef.current
    const root = document.documentElement
    const motion = window.matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)')
    if (!cursor) return

    let targetX = 0
    let targetY = 0
    let currentX = 0
    let currentY = 0
    let frame = 0
    let positioned = false
    const hideCursor = () => {
      cursor.dataset.visible = 'false'
      cursor.dataset.mode = 'default'
      cursor.dataset.pressed = 'false'
    }
    const syncMotionPreference = () => {
      if (motion.matches) root.dataset.siteCursor = 'active'
      else {
        delete root.dataset.siteCursor
        hideCursor()
        if (frame) cancelAnimationFrame(frame)
        frame = 0
      }
    }
    const animate = () => {
      const dx = targetX - currentX
      const dy = targetY - currentY
      currentX += dx * 0.22
      currentY += dy * 0.22
      cursor.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`
      if (Math.abs(dx) > 0.2 || Math.abs(dy) > 0.2) frame = requestAnimationFrame(animate)
      else frame = 0
    }
    const handleMove = (event: PointerEvent) => {
      if (event.pointerType === 'touch') { hideCursor(); return }
      if (!motion.matches) return
      targetX = event.clientX
      targetY = event.clientY
      cursor.dataset.visible = 'true'
      const target = event.target
      const element = target instanceof Element ? target : null
      cursor.dataset.mode = element?.closest(':disabled, [aria-disabled="true"]') ? 'disabled' : element?.closest('input:not([type="range"]), textarea, [contenteditable="true"]') ? 'text' : element?.closest('a, button, select, [role="button"], input[type="range"]') ? 'interactive' : 'default'
      if (!positioned) {
        positioned = true
        currentX = targetX
        currentY = targetY
        cursor.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`
      } else if (!frame) frame = requestAnimationFrame(animate)
    }
    const handleLeave = () => hideCursor()
    const handleDown = () => { cursor.dataset.pressed = 'true' }
    const handleUp = () => { cursor.dataset.pressed = 'false' }
    const handleVisibility = () => { if (document.hidden) handleLeave() }

    syncMotionPreference()
    document.addEventListener('pointermove', handleMove)
    document.documentElement.addEventListener('pointerleave', handleLeave)
    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('blur', handleLeave)
    window.addEventListener('pointerdown', handleDown)
    window.addEventListener('pointerup', handleUp)
    motion.addEventListener('change', syncMotionPreference)
    return () => {
      document.removeEventListener('pointermove', handleMove)
      document.documentElement.removeEventListener('pointerleave', handleLeave)
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('blur', handleLeave)
      window.removeEventListener('pointerdown', handleDown)
      window.removeEventListener('pointerup', handleUp)
      motion.removeEventListener('change', syncMotionPreference)
      delete root.dataset.siteCursor
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])
  return <div ref={cursorRef} className="site-cursor" aria-hidden="true" data-visible="false" data-mode="default" data-pressed="false"><span className="site-cursor-halo" /><svg className="site-cursor-arrow" viewBox="0 0 24 28"><path d="M3 2.5v20l5.2-5 4.3 8 3-1.5-4.4-8 7.1-.4L3 2.5z" /></svg></div>
}
export default function App() {
  const location = useLocation()
  return <MobileNavigationProvider><ScrollReset /><SiteCursor /><Suspense fallback={<Loading label="Opening your learning space…" />}><AnimatePresence mode="wait"><Routes location={location} key={location.pathname}>
    <Route path="/" element={<PageMotion><Landing /></PageMotion>} />
    <Route path="/login" element={<PageMotion><AuthPage mode="login" /></PageMotion>} />
    <Route path="/register" element={<PageMotion><AuthPage mode="register" /></PageMotion>} />
    <Route path="/about" element={<PageMotion><AboutPage /></PageMotion>} />
    <Route element={<PublicCatalogShell />}>
      <Route path="/explore" element={<PageMotion><ExplorePage /></PageMotion>} />
      <Route path="/students" element={<PageMotion><StudentsPage /></PageMotion>} />
      <Route path="/students/:id" element={<PageMotion><StudentPage /></PageMotion>} />
    </Route>
    <Route element={<ProductShell />}>
      <Route path="/setup" element={<PageMotion><SetupPage /></PageMotion>} />
      <Route path="/dashboard" element={<PageMotion><DashboardPage /></PageMotion>} />
      <Route path="/roadmaps/new" element={<PageMotion><RoadmapPage /></PageMotion>} />
      <Route path="/roadmaps/:id" element={<PageMotion><RoadmapPage /></PageMotion>} />
      <Route path="/sessions" element={<PageMotion><SessionsPage /></PageMotion>} />
      <Route path="/requests" element={<Navigate to="/sessions" replace />} />
      <Route path="/progress" element={<PageMotion><ProgressPage /></PageMotion>} />
      <Route path="/profile" element={<PageMotion><ProfilePage /></PageMotion>} />
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes></AnimatePresence></Suspense></MobileNavigationProvider>
}
