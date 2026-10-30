import { createElement, useEffect, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowRight, ArrowUpRight, BookOpen, Code2, Compass, Palette, Search, Shield, Sparkles, UsersRound } from 'lucide-react'
import { api, type Skill, type SkillCategory } from '../lib/api'
import { EmptyState, Loading, PageHeading, Panel, pageError } from '../components/ui'

const icons = [Code2, Palette, Shield, BookOpen, Sparkles, Compass]
export default function ExplorePage() {
  const [params, setParams] = useSearchParams()
  const [skills, setSkills] = useState<Skill[]>([])
  const [categories, setCategories] = useState<SkillCategory[]>([])
  const [q, setQ] = useState(params.get('q') || '')
  const [category, setCategory] = useState(params.get('category') || '')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => { api<SkillCategory[]>('/skills/categories/').then(setCategories).catch((err) => setError(pageError(err))) }, [])
  useEffect(() => { setLoading(true); const query = new URLSearchParams(); if (q.trim()) query.set('q', q.trim()); if (category) query.set('category', category); api<Skill[]>(`/skills/${query.size ? `?${query}` : ''}`).then(setSkills).catch((err) => setError(pageError(err))).finally(() => setLoading(false)) }, [q, category])
  const handleSearch = (event: FormEvent) => { event.preventDefault(); const next = new URLSearchParams(); if (q.trim()) next.set('q', q.trim()); if (category) next.set('category', category); setParams(next) }
  return <div className="explore-page"><div className="explore-banner"><div className="explore-banner-text"><div className="eyebrow"><span className="live-dot" /> FIND YOUR NEXT THING</div><h1>Curiosity looks<br /><em>good on you.</em></h1><p>Start with a skill, a question, or something you have been meaning to try. There is someone here who can help you get going.</p><form className="explore-search" onSubmit={handleSearch}><Search size={17} /><input aria-label="Search skills" placeholder="What are you curious about?" value={q} onChange={(e) => setQ(e.target.value)} /><button type="submit">Find a skill <ArrowRight size={14} /></button></form><div className="search-hint">TRY “DESIGN”, “PYTHON”, “BUILDING THINGS”</div></div><div className="explore-banner-art"><span className="explore-orbit eo1" /><span className="explore-orbit eo2" /><span className="explore-orbit eo3" /><span className="explore-art-center">⌘</span><span className="explore-art-dot ed1" /><span className="explore-art-dot ed2" /><span className="explore-art-dot ed3" /><span className="explore-art-sticker es1">TRY SOMETHING<br />NEW ↗</span><span className="explore-art-sticker es2">✳</span></div></div>
    <div className="explore-categories-head"><div><div className="eyebrow">A FEW PLACES TO BEGIN</div><h2>Explore by interest</h2></div><span>{categories.length} categories · {skills.length} skills</span></div>
    <div className="category-pills"><button className={`filter-pill ${!category ? 'active' : ''}`} onClick={() => setCategory('')}>Everything</button>{categories.map((item, index) => { const Icon = icons[index % icons.length]; return <button key={item.id} className={`filter-pill ${category === item.slug ? 'active' : ''}`} onClick={() => setCategory(category === item.slug ? '' : item.slug)}><Icon size={14} />{item.name}</button> })}</div>
    {error && <div className="inline-error" role="alert">{error}</div>}
    {loading ? <Loading label="Finding skills to explore…" /> : skills.length ? <div className="explore-skill-grid">{skills.map((skill, index) => <Link to={`/students?skill=${encodeURIComponent(skill.slug)}`} className={`explore-skill-card tone-${index % 5}`} key={skill.id}><div className="explore-skill-meta"><span className="skill-category-label">{skill.category.name}</span><span className="explore-skill-count"><UsersRound size={13} />{skill.teachers_count} {skill.teachers_count === 1 ? 'guide' : 'guides'}</span></div><div className="explore-skill-icon">{createElement(icons[index % icons.length], { size: 21, strokeWidth: 1.4 })}</div><h3>{skill.name}</h3><p>{skill.description || `Find peers who can help you explore ${skill.name} at your own pace.`}</p><div className="explore-skill-bottom"><span>{skill.learners_count} curious learners</span><span className="explore-arrow"><ArrowUpRight size={15} /></span></div></Link>)}</div> : <Panel><EmptyState icon={Compass} title="We don’t have a match just yet" description="Try another search or choose a different category. New skills are added as the community grows." action={<button className="button button-secondary button-small" onClick={() => { setQ(''); setCategory(''); setParams({}) }}>Clear filters</button>} /></Panel>}
    <section className="explore-bottom-cta"><div><span className="eyebrow">YOUR KNOWLEDGE IS PART OF THE COMMUNITY</span><h2>Have something to share?</h2><p>Add the skills you know to your profile and help someone take their next step.</p></div><Link to="/profile" className="button button-secondary">Add your skills <ArrowRight size={15} /></Link></section>
  </div>
}
