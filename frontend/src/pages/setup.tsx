import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Check, Plus, UsersRound, X } from 'lucide-react'
import { api, type Profile } from '../lib/api'
import { Button, Loading, PageHeading, Panel, pageError } from '../components/ui'
import { useToast } from '../state/toast'

const presets = ['Web development', 'Python', 'UI / UX design', 'Java', 'Data science', 'Cybersecurity', 'Communication', 'Problem solving']
type SkillDraft = { skill_name: string; category: string; direction: 'teach' | 'learn' | 'both'; level: string }

export default function SetupPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [goal, setGoal] = useState('')
  const [level, setLevel] = useState('beginner')
  const [interests, setInterests] = useState<string[]>([])
  const [skills, setSkills] = useState<SkillDraft[]>([])
  const [customSkill, setCustomSkill] = useState('')
  const [formats, setFormats] = useState<string[]>(['video'])
  const [isPublic, setIsPublic] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const toast = useToast()

  useEffect(() => {
    api<Profile>('/profile/me/')
      .then((data) => {
        setProfile(data)
        setName(data.display_name)
        setBio(data.bio)
        setGoal(data.learning_goal)
        setLevel(data.experience_level)
        setInterests(data.interests)
        setFormats(data.preferred_formats)
        setIsPublic(data.is_public ?? false)
        setSkills(data.skills.map((item) => ({ skill_name: item.skill.name, category: item.skill.category.name, direction: item.direction, level: item.level })))
      })
      .catch((err) => setError(pageError(err)))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Loading label="Getting your profile ready…" />

  const toggle = (list: string[], value: string, set: (next: string[]) => void) => set(list.includes(value) ? list.filter((item) => item !== value) : [...list, value])
  const addCustomSkill = () => {
    const value = customSkill.trim()
    if (value && !skills.some((item) => item.skill_name.toLowerCase() === value.toLowerCase())) {
      setSkills((current) => [...current, { skill_name: value, category: 'Other', direction: 'both', level }])
    }
    setCustomSkill('')
  }
  const save = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      await api<Profile>('/profile/me/', { method: 'PATCH', body: JSON.stringify({ display_name: name, bio, learning_goal: goal, experience_level: level, interests, preferred_formats: formats, is_public: isPublic, skills }) })
      toast('Your profile is ready to grow.')
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(pageError(err))
    } finally {
      setSaving(false)
    }
  }

  return <div className="setup-page">
    <div className="setup-top"><span className="eyebrow">A QUICK 2-STEP SETUP</span><Link to="/dashboard" className="text-link">Skip for now <ArrowRight size={14} /></Link></div>
    <PageHeading eyebrow="MAKE THIS SPACE YOURS" title={profile?.display_name ? 'Your profile.' : 'Let’s get you started.'} description="Add the basics now. You can update everything later." />
    <form onSubmit={save} className="setup-grid">
      <Panel className="setup-card">
        <div className="form-section-title"><span className="form-step">01</span><div><h2>Tell us what you want to learn</h2><p>We’ll use this to suggest a good next step.</p></div></div>
        <div className="form-grid setup-essentials">
          <label className="field-wide">What should we call you?<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" maxLength={80} required /></label>
          <label className="field-wide">What do you want to learn?<input value={goal} onChange={(event) => setGoal(event.target.value)} placeholder="For example, build my first website" maxLength={180} /></label>
        </div>
      </Panel>

      <Panel className="setup-card">
        <div className="form-section-title"><span className="form-step sage">02</span><div><h2>Pick a skill to start with</h2><p>Choose any that interest you. “Share + learn” is fine to leave as is.</p></div></div>
        <div className="interest-chips">{presets.map((item) => {
          const exists = skills.some((skill) => skill.skill_name.toLowerCase() === item.toLowerCase())
          return <button className={`interest-chip ${exists ? 'selected' : ''}`} type="button" key={item} aria-pressed={exists} onClick={() => setSkills((old) => exists ? old.filter((skill) => skill.skill_name.toLowerCase() !== item.toLowerCase()) : [...old, { skill_name: item, category: item.includes('design') ? 'Design' : item.includes('Python') || item.includes('Java') || item.includes('development') ? 'Technology' : 'Other', direction: 'both', level }])}>{exists ? <Check size={13} /> : <Plus size={13} />}{item}</button>
        })}</div>
        <div className="add-skill-row"><input value={customSkill} onChange={(event) => setCustomSkill(event.target.value)} placeholder="Or type your own skill" aria-label="Add another skill" onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addCustomSkill() } }} /><button type="button" className="button button-secondary button-small" onClick={addCustomSkill}><Plus size={14} /> Add skill</button></div>
        {skills.length > 0 && <div className="skill-drafts">{skills.map((skill, index) => <div className="skill-draft" key={`${skill.skill_name}-${index}`}><span>{skill.skill_name}</span><select aria-label={`How you relate to ${skill.skill_name}`} value={skill.direction} onChange={(event) => setSkills((old) => old.map((item, i) => i === index ? { ...item, direction: event.target.value as SkillDraft['direction'] } : item))}><option value="both">Share + learn</option><option value="teach">I can teach</option><option value="learn">I want to learn</option></select><button type="button" className="icon-button" aria-label={`Remove ${skill.skill_name}`} onClick={() => setSkills((old) => old.filter((_, i) => i !== index))}><X size={14} /></button></div>)}</div>}
      </Panel>

      <details className="setup-optional">
        <summary><span><strong>Personalize your profile</strong><small>Optional details for better matches</small></span><span className="optional-toggle">Add details</span></summary>
        <div className="setup-optional-content">
          <Panel className="setup-card"><div className="form-section-title"><div><h2>A little about you</h2><p>Help other learners get to know you.</p></div></div><div className="form-grid"><label className="field-wide">Short introduction<textarea value={bio} onChange={(event) => setBio(event.target.value)} placeholder="What are you working on or excited to share?" maxLength={280} rows={3} /><span className="field-hint">{bio.length}/280</span></label><label>Experience level<select value={level} onChange={(event) => setLevel(event.target.value)}><option value="beginner">Just starting out</option><option value="intermediate">Finding my flow</option><option value="advanced">Ready to go deeper</option></select></label></div></Panel>
          <Panel className="setup-card"><div className="form-section-title"><div><h2>How you like to learn</h2><p>Select any formats that work for you.</p></div></div><div className="format-cards">{[['in-person', 'In person', 'At a shared table'], ['video', 'Video call', 'Face-to-face, anywhere'], ['async', 'Async', 'On your own time']].map(([value, title, desc]) => <button type="button" key={value} className={`format-card ${formats.includes(value) ? 'active' : ''}`} aria-pressed={formats.includes(value)} onClick={() => toggle(formats, value, setFormats)}><span className="format-card-check">{formats.includes(value) && <Check size={12} />}</span><strong>{title}</strong><small>{desc}</small></button>)}</div></Panel>
          <Panel className="setup-card"><div className="form-section-title"><div><h2>Your interests</h2><p>These help us suggest people and learning paths.</p></div></div><div className="interest-chips">{['Building things', 'Creative practice', 'Open source', 'Startups', 'Research', 'Community', 'Design systems', 'AI & emerging tech'].map((item) => <button className={`interest-chip ${interests.includes(item) ? 'selected' : ''}`} type="button" key={item} aria-pressed={interests.includes(item)} onClick={() => toggle(interests, item, setInterests)}>{interests.includes(item) ? <Check size={13} /> : <Plus size={13} />}{item}</button>)}</div></Panel>
          <Panel className="setup-card privacy-card"><div className="privacy-toggle-copy"><span className="privacy-symbol"><UsersRound size={16} /></span><div><h2>Show my profile to learners</h2><p>Your name, introduction, skills, interests, and learning formats may appear in the learner directory. Your email and contact details stay private.</p></div></div><button type="button" className={`switch-control ${isPublic ? 'on' : ''}`} role="switch" aria-checked={isPublic} onClick={() => setIsPublic((value) => !value)}><span /> <b>{isPublic ? 'Profile visible' : 'Profile private'}</b></button></Panel>
        </div>
      </details>

      <div className="setup-submit">{error && <span className="form-error" role="alert">{error}</span>}<Button type="submit" className="button-large" disabled={saving}>{saving ? <><span className="spinner spinner-small" />Saving your profile…</> : <>Save and continue <ArrowRight size={16} /></>}</Button><span>You can change these details any time.</span></div>
    </form>
  </div>
}
