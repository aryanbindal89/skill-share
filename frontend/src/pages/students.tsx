import { useEffect, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowRight, ArrowUpRight, GraduationCap, MapPin, Search, SlidersHorizontal, UsersRound } from 'lucide-react'
import { api, type Profile, type SkillCategory, type Student } from '../lib/api'
import { EmptyState, Loading, PageHeading, Panel, pageError } from '../components/ui'

type Page<T> = { count: number; next: string | null; previous: string | null; results: T[] }
function getTeacherSkills(profile: Profile) { return profile.skills.filter((skill) => ['teach', 'both'].includes(skill.direction)) }

export default function StudentsPage() {
  const [params, setParams] = useSearchParams()
  const [students, setStudents] = useState<Student[]>([])
  const [categories, setCategories] = useState<SkillCategory[]>([])
  const [q, setQ] = useState(params.get('q') || '')
  const [category, setCategory] = useState(params.get('category') || '')
  const [level, setLevel] = useState(params.get('level') || '')
  const [direction, setDirection] = useState(params.get('direction') || 'teach')
  const [skill, setSkill] = useState(params.get('skill') || '')
  const [page, setPage] = useState(Number(params.get('page') || 1))
  const [count, setCount] = useState(0)
  const [hasNext, setHasNext] = useState(false)
  const [hasPrevious, setHasPrevious] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const fetch = () => {
    const query = new URLSearchParams({ page: String(page), direction });
    if (q.trim()) query.set('q', q.trim()); if (category) query.set('category', category); if (level) query.set('level', level); if (skill) query.set('skill', skill)
    setLoading(true); api<Page<Student>>(`/students/?${query}`).then((result) => { setStudents(result.results); setCount(result.count); setHasNext(!!result.next); setHasPrevious(!!result.previous); setError('') }).catch((err) => setError(pageError(err))).finally(() => setLoading(false))
  }
  useEffect(() => { api<SkillCategory[]>('/skills/categories/').then(setCategories).catch(() => {}) }, [])
  useEffect(fetch, [q, category, level, direction, skill, page])
  const submit = (e: FormEvent) => { e.preventDefault(); setPage(1); const next = new URLSearchParams(); if (q) next.set('q', q); if (category) next.set('category', category); if (level) next.set('level', level); if (skill) next.set('skill', skill); if (direction !== 'teach') next.set('direction', direction); setParams(next) }
  return <div className="students-page"><PageHeading eyebrow="PEER LEARNING STARTS HERE" title="Find your people." description="Learn from someone a few steps ahead. Share what you know with someone just getting started." action={<Link to="/sessions" className="button button-secondary button-small">My requests <ArrowUpRight size={14} /></Link>} />
    <Panel className="student-filter-panel"><form className="student-filters" onSubmit={submit}><label className="student-search"><Search size={16} /><input placeholder="Search people, skills, or goals" value={q} onChange={(e) => setQ(e.target.value)} /><button type="submit" aria-label="Search learners"><ArrowRight size={15} /></button></label><label className="filter-select"><SlidersHorizontal size={15} /><select value={direction} onChange={(e) => { setDirection(e.target.value); setPage(1) }}><option value="teach">Can teach</option><option value="learn">Wants to learn</option></select></label><label className="filter-select"><select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1) }}><option value="">All categories</option>{categories.map((item) => <option value={item.slug} key={item.id}>{item.name}</option>)}</select></label><label className="filter-select"><select value={level} onChange={(e) => { setLevel(e.target.value); setPage(1) }}><option value="">Any level</option><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></select></label></form><div className="filter-summary"><span>{skill ? `Showing ${skill} · ` : ''}{loading ? 'Finding the right people…' : `${count} ${count === 1 ? 'learner' : 'learners'} in the community`}</span><button type="button" onClick={() => { setQ(''); setCategory(''); setLevel(''); setDirection('teach'); setSkill(''); setPage(1); setParams({}) }}>Clear filters</button></div></Panel>
    {error && <div className="inline-error" role="alert">{error}</div>}
    {loading ? <Loading label="Finding learners…" /> : students.length ? <div className="student-grid">{students.map((student, index) => { const offerings = getTeacherSkills(student); const learning = student.skills.filter((item) => ['learn', 'both'].includes(item.direction)); return <article className={`student-card student-tone-${index % 4}`} key={student.user_id}><div className="student-card-top"><div className="avatar avatar-xl">{(student.display_name?.[0] || student.username[0]).toUpperCase()}</div><span className="level-badge">{student.experience_level}</span></div><h2>{student.display_name || student.username}</h2><span className="student-handle">@{student.username}</span><p className="student-bio">{student.bio || student.learning_goal || 'Part of the SkillShare learning community.'}</p><div className="student-skills"><span>CAN SHARE</span><div className="tag-list">{offerings.slice(0, 3).map((item) => <span className="skill-tag skill-tag-warm" key={item.id}>{item.skill.name}</span>)}{!offerings.length && <span className="tiny-muted">Exploring ways to learn</span>}</div></div><div className="student-skills student-learning"><span>ALSO CURIOUS ABOUT</span><div className="tag-list">{learning.slice(0, 2).map((item) => <span className="skill-tag skill-tag-sage" key={item.id}>{item.skill.name}</span>)}{!learning.length && <span className="tiny-muted">Something new</span>}</div></div><div className="student-card-bottom"><span className="student-format"><MapPin size={13} />{student.preferred_formats?.[0] || 'Open to learning'}</span><Link to={`/students/${student.user_id}`} className="button button-secondary button-small">Say hello <ArrowRight size={14} /></Link></div></article> })}</div> : <Panel><EmptyState icon={UsersRound} title="Your people are still finding their way here" description="Try a different filter or add a skill to your profile so other learners can find you." action={<Link className="button button-primary button-small" to="/profile">Set up your profile <ArrowRight size={14} /></Link>} /></Panel>}
    {!loading && (hasNext || hasPrevious) && <div className="pagination-row"><button className="button button-secondary button-small" disabled={!hasPrevious} onClick={() => setPage((n) => Math.max(1, n - 1))}>Previous</button><span>Page {page}</span><button className="button button-secondary button-small" disabled={!hasNext} onClick={() => setPage((n) => n + 1)}>Next <ArrowRight size={14} /></button></div>}
    <div className="community-note"><GraduationCap size={17} /><span>SkillShare is better when we show up for each other. Your skills and experience matter here, wherever you are starting from.</span><Link to="/profile">Add your skills <ArrowRight size={14} /></Link></div>
  </div>
}
