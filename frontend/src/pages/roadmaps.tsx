import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, ArrowUpRight, Check, ChevronDown, Clock3, Download, Edit3, Layers3, Lightbulb, LoaderCircle, Plus, RefreshCw, Sparkles, Trash2 } from 'lucide-react'
import { api, type Roadmap, type RoadmapTask } from '../lib/api'
import { Button, Loading, PageHeading, Panel, pageError, formatDate } from '../components/ui'
import { useToast } from '../state/toast'

const levels = [['beginner', 'Just starting out'], ['intermediate', 'Finding my flow'], ['advanced', 'Ready to go deeper']]
const styles = ['Project based', 'Reading and research', 'Hands on practice', 'Pair learning', 'A mix of everything']

export default function RoadmapPage() {
  const { id } = useParams()
  if (!id || id === 'new') return <RoadmapBuilder />
  return <RoadmapDetail id={id} />
}

function RoadmapBuilder() {
  const [target, setTarget] = useState('')
  const [level, setLevel] = useState('beginner')
  const [known, setKnown] = useState('')
  const [hours, setHours] = useState(4)
  const [weeks, setWeeks] = useState(8)
  const [style, setStyle] = useState('Project based')
  const [interests, setInterests] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const activeRequest = useRef<AbortController | null>(null)
  const navigate = useNavigate()
  const toast = useToast()
  useEffect(() => () => activeRequest.current?.abort(), [])
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError(''); setBusy(true)
    const controller = new AbortController()
    activeRequest.current = controller
    try {
      const roadmap = await api<Roadmap>('/roadmaps/generate/', { method: 'POST', signal: controller.signal, body: JSON.stringify({ target, current_level: level, known_skills: known.split(',').map((item) => item.trim()).filter(Boolean), hours_per_week: hours, target_weeks: weeks, learning_style: style, areas_of_interest: interests.split(',').map((item) => item.trim()).filter(Boolean) }) })
      toast('Your learning path is ready.'); navigate(`/roadmaps/${roadmap.id}`)
    } catch (err) { if (!controller.signal.aborted) setError(pageError(err)) } finally { if (activeRequest.current === controller) activeRequest.current = null; setBusy(false) }
  }
  return <div className="roadmap-builder-page"><PageHeading eyebrow="AI LEARNING ROADMAP" title="Give your goal a path." description="A good plan starts with where you are, then gives you one clear next step at a time." action={<Link to="/dashboard" className="back-link"><ArrowLeft size={14} /> Back to your space</Link>} />
    <div className="builder-layout"><form className="builder-form" onSubmit={submit}><Panel className="builder-panel"><div className="builder-panel-heading"><span className="builder-step">01</span><div><h2>Where are you headed?</h2><p>Start with a skill, a project, or a future you are curious about.</p></div></div><label>What do you want to learn?<input value={target} onChange={(e) => setTarget(e.target.value)} placeholder="e.g. Build full stack web apps" maxLength={140} required autoFocus /><span className="field-hint">Be specific enough to make this useful.</span></label><label>How much experience do you have?<select value={level} onChange={(e) => setLevel(e.target.value)}>{levels.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label>What do you already know?<input value={known} onChange={(e) => setKnown(e.target.value)} placeholder="e.g. HTML, a little Python, visual design" /><span className="field-hint">Separate a few skills with commas. This is optional.</span></label></Panel>
      <Panel className="builder-panel"><div className="builder-panel-heading"><span className="builder-step sage">02</span><div><h2>Make it fit your life.</h2><p>We'll use your time and preferences to shape a comfortable pace.</p></div></div><div className="range-row"><label>Time you can set aside<span className="range-value">{hours} <small>hours / week</small></span><input type="range" min="1" max="20" value={hours} onChange={(e) => setHours(Number(e.target.value))} /></label><label>Time horizon<span className="range-value">{weeks} <small>weeks</small></span><input type="range" min="2" max="24" step="2" value={weeks} onChange={(e) => setWeeks(Number(e.target.value))} /></label></div><label>How do you like to learn?<select value={style} onChange={(e) => setStyle(e.target.value)}>{styles.map((item) => <option key={item}>{item}</option>)}</select></label><label>Any areas you're especially interested in?<input value={interests} onChange={(e) => setInterests(e.target.value)} placeholder="e.g. accessibility, indie games, creative coding" /><span className="field-hint">Optional. Add interests separated by commas.</span></label></Panel>
      {error && <div className="inline-error" role="alert">{error}</div>}<div className="builder-submit"><div className="builder-submit-row"><Button type="submit" className="button-large" disabled={busy}>{busy ? <><span className="spinner spinner-small" />Building a useful path…</> : <>Make my roadmap <Sparkles size={16} /></>}</Button>{busy && <button type="button" className="button button-ghost button-small" onClick={() => activeRequest.current?.abort()}>Cancel</button>}</div><span>Recommendations to explore at your own pace. No promises or magic timelines.</span></div></form>
      <aside className="builder-aside"><div className="builder-aside-art"><span className="builder-arc ba1" /><span className="builder-arc ba2" /><span className="builder-arc ba3" /><span className="builder-center"><Layers3 size={22} /></span><span className="builder-node bn1">✦</span><span className="builder-node bn2">01</span><span className="builder-node bn3">02</span><span className="builder-node bn4">03</span></div><div className="builder-aside-copy"><span className="eyebrow">SMALL STEPS. REAL MOMENTUM.</span><h3>Make progress<br />feel possible.</h3><p>Your roadmap will break the goal into approachable phases, practical exercises, and projects you can try.</p></div><div className="builder-aside-facts"><span><Check size={14} /> Save and come back when you like</span><span><Check size={14} /> Update progress as you learn</span><span><Check size={14} /> A useful fallback works offline</span></div></aside></div>
  </div>
}

function RoadmapDetail({ id }: { id: string }) {
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyTask, setBusyTask] = useState<number | null>(null)
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editGoal, setEditGoal] = useState('')
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const navigate = useNavigate()
  const toast = useToast()
  useEffect(() => { api<Roadmap>(`/roadmaps/${id}/`).then(setRoadmap).catch((err) => setError(pageError(err))).finally(() => setLoading(false)) }, [id])
  const phases = useMemo(() => {
    const map = new Map<string, RoadmapTask[]>()
    roadmap?.tasks.forEach((task) => map.set(task.phase, [...(map.get(task.phase) || []), task]))
    return [...map.entries()]
  }, [roadmap])
  const toggleTask = async (task: RoadmapTask) => {
    if (!roadmap || busyTask) return
    const completed = !task.completed_at
    setBusyTask(task.id)
    setRoadmap({ ...roadmap, tasks: roadmap.tasks.map((item) => item.id === task.id ? { ...item, completed_at: completed ? new Date().toISOString() : null } : item), completed_tasks: roadmap.completed_tasks + (completed ? 1 : -1), progress: Math.round((roadmap.completed_tasks + (completed ? 1 : -1)) * 100 / roadmap.total_tasks) })
    try { await api(`/roadmaps/${roadmap.id}/tasks/${task.id}/`, { method: 'PATCH', body: JSON.stringify({ completed }) }) }
    catch (err) { setError(pageError(err)); const current = await api<Roadmap>(`/roadmaps/${roadmap.id}/`).catch(() => null); if (current) setRoadmap(current) }
    finally { setBusyTask(null) }
  }
  const beginEdit = () => { if (!roadmap) return; setEditTitle(roadmap.title); setEditGoal(roadmap.target); setEditing(true) }
  const saveEdit = async (event: FormEvent) => { event.preventDefault(); if (!roadmap) return; try { const updated = await api<Roadmap>(`/roadmaps/${roadmap.id}/`, { method: 'PATCH', body: JSON.stringify({ title: editTitle, target: editGoal }) }); setRoadmap(updated); setEditing(false); toast('Your roadmap details were updated.') } catch (err) { setError(pageError(err)) } }
  const removeRoadmap = async () => { if (!roadmap) return; setDeleting(true); try { await api(`/roadmaps/${roadmap.id}/`, { method: 'DELETE' }); toast('Roadmap removed.'); navigate('/dashboard') } catch (err) { setError(pageError(err)); setDeleteOpen(false) } finally { setDeleting(false) } }
  if (loading) return <Loading label="Opening your roadmap…" />
  if (!roadmap) return <div><Link to="/dashboard" className="back-link"><ArrowLeft size={14} /> Back to your space</Link><div className="inline-error" role="alert">{error || 'This roadmap is no longer available.'}</div></div>
  const allDone = roadmap.total_tasks > 0 && roadmap.completed_tasks === roadmap.total_tasks
  return <div className="roadmap-detail-page"><div className="roadmap-detail-top"><Link to="/dashboard" className="back-link"><ArrowLeft size={14} /> Your learning space</Link><div className="roadmap-detail-actions"><button className="button button-secondary button-small" onClick={beginEdit}><Edit3 size={14} /> Edit details</button><Link className="button button-secondary button-small" to="/roadmaps/new"><RefreshCw size={14} /> Make a new plan</Link><button className="icon-button danger-icon" onClick={() => setDeleteOpen(true)} aria-label="Delete roadmap" title="Delete roadmap"><Trash2 size={15} /></button></div></div>
    <div className="roadmap-hero-panel"><div className="roadmap-hero-info"><div className="eyebrow"><span className="live-dot" /> YOUR LEARNING PATH</div><h1>{roadmap.title}</h1><p>A path toward <strong>{roadmap.target}</strong>, shaped for your experience and the time you have.</p><div className="roadmap-hero-tags"><span><Clock3 size={13} /> {roadmap.hours_per_week} hr / week</span><span>{roadmap.target_weeks} week horizon</span><span>{roadmap.current_level}</span></div><div className="roadmap-origin-note"><Sparkles size={14} />{roadmap.generated_by === 'provider' ? 'AI assisted suggestions · Check sources and adapt as you go.' : 'Structured recommendations · A local fallback is ready to use.'}</div></div><div className="roadmap-progress-visual" style={{ '--progress': `${roadmap.progress}%` } as React.CSSProperties}><div><strong>{roadmap.progress}<small>%</small></strong><span>complete</span></div><span className="progress-visual-caption">{roadmap.completed_tasks} of {roadmap.total_tasks} steps</span></div></div>
    {error && <div className="inline-error" role="alert">{error}</div>}
    {allDone && <Panel className="roadmap-finish-panel"><span className="finish-mark">✳</span><div><h2>You made it all the way through.</h2><p>Take a moment to notice what you can do now. When you’re ready, choose what you would like to explore next.</p></div><Link to="/roadmaps/new" className="button button-secondary button-small">Find a new goal <ArrowRight size={14} /></Link></Panel>}
    <div className="roadmap-body-grid"><div className="roadmap-timeline-column"><div className="roadmap-section-heading"><div><span className="eyebrow">YOUR NEXT STEPS</span><h2>Learn by doing.</h2></div><span className="roadmap-step-count">{roadmap.total_tasks} {roadmap.total_tasks === 1 ? 'step' : 'steps'}</span></div><div className="roadmap-timeline">{phases.map(([phase, tasks], phaseIndex) => <section className="roadmap-phase" key={phase}><div className="phase-marker"><span>{phaseIndex + 1}</span><i /></div><div className="phase-content"><div className="phase-heading"><div><span className="phase-kicker">PHASE {String(phaseIndex + 1).padStart(2, '0')}</span><h3>{phase}</h3></div><span className="phase-count">{tasks.filter((task) => task.completed_at).length}/{tasks.length}</span></div>{tasks.map((task) => <article className={`roadmap-task ${task.completed_at ? 'task-complete' : ''}`} key={task.id}><button className="task-checkbox" onClick={() => toggleTask(task)} disabled={!!busyTask} aria-label={`${task.completed_at ? 'Mark incomplete' : 'Mark complete'}: ${task.title}`} aria-pressed={!!task.completed_at}>{busyTask === task.id ? <LoaderCircle className="spin" size={16} /> : task.completed_at ? <Check size={15} /> : null}</button><div className="task-content"><div className="task-title-row"><h4>{task.title}</h4><span><Clock3 size={12} />{task.estimated_hours}h</span></div><p>{task.description}</p>{task.project && <div className="task-project"><Lightbulb size={14} /><span><b>Try this:</b> {task.project}</span></div>}{task.prerequisites.length > 0 && <div className="task-prereqs">Builds on {task.prerequisites.join(' · ')}</div>}{task.completed_at && <span className="task-complete-date">Completed {formatDate(task.completed_at)}</span>}</div></article>)}</div></section>)}</div></div>
      <aside className="roadmap-side-column"><Panel className="roadmap-side-card"><div className="roadmap-side-symbol"><Sparkles size={19} /></div><span className="eyebrow">KEEP THIS YOURS</span><h3>Make the plan<br />work for you.</h3><p>Change the pace, take a detour, or repeat the basics. Learning is not a straight line.</p><button className="text-link" onClick={beginEdit}>Edit your roadmap <Edit3 size={14} /></button></Panel><Panel className="roadmap-meta-card"><span className="eyebrow">ROADMAP NOTES</span><div className="meta-row"><span>Created</span><strong>{formatDate(roadmap.created_at)}</strong></div><div className="meta-row"><span>Learning style</span><strong>{roadmap.learning_style || 'Flexible'}</strong></div><div className="meta-row"><span>Focus areas</span><strong>{roadmap.areas_of_interest?.length ? roadmap.areas_of_interest.slice(0, 3).join(', ') : 'Open exploration'}</strong></div></Panel><div className="roadmap-side-reminder"><span>✳</span><p>Progress means returning, trying again, and asking for help. You are doing the work.</p></div></aside></div>
    {editing && <div className="modal-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setEditing(false) }}><div className="modal-card" role="dialog" aria-modal="true" aria-labelledby="edit-roadmap-title"><div className="modal-heading"><div><span className="eyebrow">A FEW DETAILS</span><h2 id="edit-roadmap-title">Shape your roadmap.</h2></div><button className="icon-button" onClick={() => setEditing(false)} aria-label="Close editor">×</button></div><form onSubmit={saveEdit} className="edit-roadmap-form"><label>Roadmap name<input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} maxLength={140} required /></label><label>Learning goal<input value={editGoal} onChange={(e) => setEditGoal(e.target.value)} maxLength={140} required /></label><div className="modal-actions"><button type="button" className="button button-ghost" onClick={() => setEditing(false)}>Cancel</button><Button type="submit">Save changes <Check size={15} /></Button></div></form></div></div>}
    {deleteOpen && <div className="modal-backdrop" role="presentation"><div className="modal-card" role="alertdialog" aria-modal="true" aria-labelledby="delete-roadmap-title"><div className="modal-heading"><div><span className="eyebrow">REMOVE ROADMAP</span><h2 id="delete-roadmap-title">Are you sure?</h2></div><button className="icon-button" onClick={() => setDeleteOpen(false)} aria-label="Close dialog">×</button></div><p className="modal-copy">Deleting this roadmap also removes its task history. This cannot be undone.</p><div className="modal-actions"><button className="button button-ghost" onClick={() => setDeleteOpen(false)}>Keep roadmap</button><button className="button button-danger" onClick={removeRoadmap} disabled={deleting}>{deleting ? 'Removing…' : 'Delete roadmap'} <Trash2 size={14} /></button></div></div></div>}
  </div>
}
