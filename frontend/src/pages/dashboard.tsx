import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ArrowUpRight, BookOpen, CalendarDays, Compass, Flame, Layers3, Sparkles, UsersRound } from 'lucide-react'
import { api, type LearningRequest, type Profile, type Progress, type Roadmap, type Student } from '../lib/api'
import { EmptyState, Loading, PageHeading, Panel, TextLink, formatDate, pageError } from '../components/ui'
import { useAuth } from '../state/auth'

type Page<T> = { results: T[]; count: number }

function firstName(profile?: Profile | null, username?: string) {
  const name = profile?.display_name?.trim() || username || 'learner'
  return name.split(/\s+/)[0]
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([])
  const [sessions, setSessions] = useState<LearningRequest[]>([])
  const [progress, setProgress] = useState<Progress | null>(null)
  const [peers, setPeers] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => {
    Promise.all([api<Profile>('/profile/me/'), api<Page<Roadmap>>('/roadmaps/'), api<Page<LearningRequest>>('/sessions/'), api<Progress>('/progress/'), api<Page<Student>>('/students/?page=1')])
      .then(([p, r, s, pr, st]) => { setProfile(p); setRoadmaps(r.results); setSessions(s.results); setProgress(pr); setPeers(st.results.slice(0, 3)) })
      .catch((err) => setError(pageError(err))).finally(() => setLoading(false))
  }, [])
  const nextSession = sessions.find((session) => new Date(session.suggested_at).getTime() > Date.now())
  const activeRoadmap = roadmaps[0]
  const profilePercent = useMemo(() => {
    if (!profile) return 0
    const score = [!!profile.display_name, !!profile.bio, !!profile.learning_goal, profile.skills.length > 0, profile.interests.length > 0].filter(Boolean).length
    return Math.round(score * 20)
  }, [profile])
  if (loading) return <Loading label="Gathering your learning space…" />
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const offered = profile?.skills.filter((item) => ['teach', 'both'].includes(item.direction)) || []
  const learning = profile?.skills.filter((item) => ['learn', 'both'].includes(item.direction)) || []
  return <div className="dashboard-page">
    <div className="dashboard-welcome"><div><div className="eyebrow"><span className="live-dot" /> YOUR LEARNING SPACE</div><h1>{greeting}, {firstName(profile, user?.username)}<span className="greeting-star">✳</span></h1><p>What would you like to move forward today?</p></div><Link to="/roadmaps/new" className="button button-primary">Plan your next step <ArrowRight size={16} /></Link></div>
    {error && <div className="inline-error" role="alert">{error}</div>}
    <div className="dashboard-overview-grid">
      <Panel className="welcome-panel"><div className="welcome-panel-head"><div><span className="eyebrow">YOUR PROFILE</span><span className="completion-label">{profilePercent}% complete</span></div><Link to="/profile" className="avatar avatar-lg">{(profile?.display_name?.[0] || user?.username[0] || 'S').toUpperCase()}</Link></div><h2>{profile?.display_name ? `Hello, ${firstName(profile, user?.username)}.` : 'Make this space yours.'}</h2><p>{profile?.bio || 'A few details help the right people find you and make your learning path more personal.'}</p><div className="completion-track"><span style={{ width: `${profilePercent}%` }} /></div><TextLink to="/profile">{profilePercent >= 100 ? 'Review your profile' : 'Complete your profile'}</TextLink></Panel>
      <Panel className="learning-snapshot"><div className="panel-overline"><span className="eyebrow">IN YOUR CORNER</span><Sparkles size={16} /></div><div className="snapshot-metrics"><div><strong>{progress?.completed_tasks || 0}</strong><span>steps completed</span></div><div><strong>{progress?.current_streak || 0}<small>d</small></strong><span>learning streak</span></div><div><strong>{progress?.sessions_attended || 0}</strong><span>sessions attended</span></div></div><div className="snapshot-caption"><span className="snapshot-tiny-mark">✳</span><span>Every little bit of progress counts.</span><Link to="/progress"><ArrowUpRight size={15} /></Link></div></Panel>
    </div>
    <div className="dashboard-section-heading"><div><span className="eyebrow">A GOOD PLACE TO PICK UP</span><h2>Your learning, in motion</h2></div><Link to="/progress" className="text-link">See your progress <ArrowUpRight size={14} /></Link></div>
    <div className="dashboard-main-grid">
      <Panel className="roadmap-dashboard-panel"><div className="dashboard-panel-top"><span className="eyebrow"><Layers3 size={14} /> YOUR ROADMAP</span>{activeRoadmap && <span className="tiny-status">{activeRoadmap.progress}% complete</span>}</div>{activeRoadmap ? <><h3>{activeRoadmap.title}</h3><p className="muted">A path to {activeRoadmap.target} · {activeRoadmap.total_tasks} steps</p><div className="roadmap-progress-track"><span style={{ width: `${activeRoadmap.progress}%` }} /></div><div className="roadmap-mini-steps">{activeRoadmap.tasks.slice(0, 4).map((task, index) => <span key={task.id} className={task.completed_at ? 'done' : index === 0 ? 'current' : ''}><i>{task.completed_at ? '✓' : String(index + 1).padStart(2, '0')}</i><b>{task.title}</b></span>)}</div><TextLink to={`/roadmaps/${activeRoadmap.id}`}>Continue this roadmap</TextLink></> : <EmptyState icon={Layers3} title="Your next step is waiting" description="Tell us what you want to learn and we’ll shape it into a practical roadmap." action={<Link to="/roadmaps/new" className="button button-secondary button-small">Build a roadmap <ArrowRight size={14} /></Link>} />}</Panel>
      <Panel className="next-session-panel"><div className="dashboard-panel-top"><span className="eyebrow"><CalendarDays size={14} /> LEARNING TOGETHER</span><Link to="/sessions" className="icon-link" aria-label="View learning sessions"><ArrowUpRight size={15} /></Link></div>{nextSession ? <><div className="session-date-chip"><span>{formatDate(nextSession.suggested_at, true)}</span><span className="session-date-dot" /></div><h3>{nextSession.topic}</h3><p className="muted">With {nextSession.sender_name === user?.username ? nextSession.recipient_name : nextSession.sender_name}</p><div className="session-card-bottom"><span className="status-tag accepted">Confirmed</span><Link to="/sessions">Session details <ArrowRight size={14} /></Link></div></> : <EmptyState icon={CalendarDays} title="Make a little room to learn" description="Ask a peer to share a skill, or accept an invitation to learn together." action={<Link to="/students" className="button button-secondary button-small">Find a peer <UsersRound size={14} /></Link>} />}</Panel>
    </div>
    <div className="dashboard-bottom-grid">
      <Panel className="skill-stack-panel"><div className="dashboard-panel-top"><span className="eyebrow"><BookOpen size={14} /> YOUR SKILLS</span><Link className="icon-link" to="/profile" aria-label="Edit skills"><ArrowUpRight size={15} /></Link></div><div className="skill-stack-groups"><div><span className="skill-stack-label">I CAN SHARE</span>{offered.length ? <div className="tag-list">{offered.slice(0, 5).map((item) => <span className="skill-tag skill-tag-warm" key={item.id}>{item.skill.name}</span>)}</div> : <p className="tiny-muted">Add a skill you can teach.</p>}</div><div><span className="skill-stack-label">I'M CURIOUS ABOUT</span>{learning.length ? <div className="tag-list">{learning.slice(0, 5).map((item) => <span className="skill-tag skill-tag-sage" key={item.id}>{item.skill.name}</span>)}</div> : <p className="tiny-muted">What would you like to learn?</p>}</div></div></Panel>
      <Panel className="peer-panel"><div className="dashboard-panel-top"><span className="eyebrow"><UsersRound size={14} /> PEOPLE TO MEET</span><Link className="text-link" to="/students">Discover <ArrowUpRight size={14} /></Link></div>{peers.length ? <div className="peer-list">{peers.map((peer) => <Link className="peer-row" to={`/students/${peer.user_id}`} key={peer.user_id}><span className="avatar avatar-sm">{(peer.display_name?.[0] || peer.username[0]).toUpperCase()}</span><span className="peer-row-info"><strong>{peer.display_name || peer.username}</strong><small>{peer.skills[0]?.skill.name || peer.learning_goal || 'Learning something new'}</small></span><ArrowRight size={15} /></Link>)}</div> : <EmptyState icon={Compass} title="Your community starts here" description="Explore skill pages to meet students who are ready to share what they know." action={<Link to="/explore" className="text-link">Explore skills <ArrowRight size={14} /></Link>} />}</Panel>
    </div>
  </div>
}
