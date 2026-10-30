import { lazy, Suspense } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowDown, ArrowRight, ArrowUpRight, BadgeCheck, BookOpenCheck, BrainCircuit, CalendarDays, ChevronRight, Compass, Lightbulb, Network, Play, Sparkles, UsersRound } from 'lucide-react'
import { Brand, PublicHeader, useReducedMotion } from '../components/ui'

const HeroScene = lazy(() => import('../components/HeroScene'))
const categories = [
  { name: 'Web development', slug: 'web-development', icon: '⌘', color: 'warm' },
  { name: 'Python', slug: 'programming', icon: 'Py', color: 'sage' },
  { name: 'UI / UX design', slug: 'design', icon: '✳', color: 'lavender' },
  { name: 'Data science', slug: 'data-science', icon: '◉', color: 'gold' },
  { name: 'Cybersecurity', slug: 'cybersecurity', icon: '⌑', color: 'blue' },
  { name: 'Communication', slug: 'communication', icon: '↗', color: 'rose' },
]
const featureItems = [
  { icon: UsersRound, number: '01', title: 'Learn from people', text: 'Meet students who have been where you are going. Share what you know, ask what you wonder.' },
  { icon: BrainCircuit, number: '02', title: 'Find your next step', text: 'Turn a big ambition into a practical, personal path you can make progress on each week.' },
  { icon: CalendarDays, number: '03', title: 'Make time to grow', text: 'Suggest a session, swap ideas, and keep the momentum going together.' },
]

export default function Landing() {
  const navigate = useNavigate()
  const reduced = useReducedMotion()
  return <div className="marketing-page"><PublicHeader />
    <main>
      <section className="hero-section">
        <div className="hero-grid" />
        <div className="hero-copy">
          <div className="hero-kicker"><span className="live-dot" /> THE LEARNING COMMUNITY FOR WHAT'S NEXT</div>
          <h1>Your skills.<br />Your people.<br /><em>Your next level.</em></h1>
          <p className="hero-lede">The best way forward is together. Learn from people around you, share what you know, and turn your goals into a path you can actually follow.</p>
          <div className="hero-actions"><Link to="/roadmaps/new" className="button button-primary button-large">Build my learning roadmap <ArrowRight size={17} /></Link><Link to="/explore" className="button button-secondary button-large"><Play size={15} /> Explore the community</Link></div>
          <div className="hero-note"><div className="note-avatars" aria-hidden="true"><span /><span /><span /></div><span>Good things happen when we learn together.</span></div>
        </div>
        <div className="hero-art"><div className="scene-halo" />
          {reduced ? <div className="scene-static"><span className="static-orbit orbit-one" /><span className="static-orbit orbit-two" /><span className="static-core">s.</span><span className="static-node n-one">Design</span><span className="static-node n-two">Code</span><span className="static-node n-three">Ideas</span><span className="static-node n-four">Data</span></div> : <Suspense fallback={<div className="scene-loading"><div className="loading-gem" /><span>Setting up your learning map</span></div>}><HeroScene onSelect={(category) => navigate(`/explore?category=${encodeURIComponent(category)}`)} /></Suspense>}
          <div className="hero-orbit-label label-top"><span /> Skill exchange <b>01</b></div><div className="hero-orbit-label label-bottom"><span /> Learning path <b>02</b></div>
        </div>
        <a className="scroll-cue" href="#how"><span>SCROLL TO EXPLORE</span><ArrowDown size={14} /></a>
        <div className="hero-index">H / R&nbsp;&nbsp; 01 — 04</div>
      </section>

      <section className="intro-band" id="how"><div className="intro-top"><span className="eyebrow">A DIFFERENT KIND OF LEARNING SPACE</span><span className="intro-line" /></div><div className="intro-copy"><h2>Knowledge grows<br /><span>when we share it.</span></h2><p>SkillShare brings the people and the plan together. Find a peer who gets it, work towards something real, and make learning part of how you grow.</p><Link className="text-link" to="/about">A little more about us <ArrowUpRight size={15} /></Link></div><div className="intro-stamp"><span>HACKER<br />_RUN</span><span className="stamp-spark">✳</span><small>BUILT TO LEARN<br />BUILT TOGETHER</small></div></section>

      <section className="steps-section"><div className="section-topline"><div><div className="eyebrow">FROM CURIOUS TO CAPABLE</div><h2>Make a little progress.<br /><em>Then a little more.</em></h2></div><p>No perfect starting point required. Bring a goal, a question, or something you are excited to teach.</p></div><div className="steps-grid">{featureItems.map((item, index) => <motion.article className="step-card" key={item.number} initial={reduced ? false : { opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .25 }} transition={{ delay: index * .08, duration: .45 }}><div className="step-card-top"><span className="step-number">{item.number} / 03</span><item.icon size={21} strokeWidth={1.5} /></div><div className="step-icon"><item.icon size={22} strokeWidth={1.4} /></div><h3>{item.title}</h3><p>{item.text}</p><span className="step-decoration">✳</span></motion.article>)}</div></section>

      <section className="path-callout"><div className="path-graphic"><div className="path-ring ring-a" /><div className="path-ring ring-b" /><div className="path-center"><Sparkles size={23} /></div><span className="path-node pn1" /><span className="path-node pn2" /><span className="path-node pn3" /><span className="path-node pn4" /></div><div className="path-copy"><div className="eyebrow">A PLAN THAT STARTS WITH YOU</div><h2>Big goals. Smaller<br /><em>next steps.</em></h2><p>Tell us where you want to go and what you already know. Get a practical roadmap shaped around your pace, your interests, and the time you have.</p><Link to="/roadmaps/new" className="button button-primary">Build your roadmap <ArrowRight size={16} /></Link></div><div className="path-index">02<br /><span>04</span></div></section>

      <section className="category-section"><div className="category-heading"><div><div className="eyebrow">START WITH WHAT INTERESTS YOU</div><h2>There is always<br /><em>something to learn.</em></h2></div><Link to="/explore" className="text-link">Browse every skill <ArrowUpRight size={15} /></Link></div><div className="category-grid">{categories.map((category, index) => <Link className={`category-tile ${category.color}`} to={`/explore?category=${encodeURIComponent(category.slug)}`} key={category.slug}><span className="category-tile-index">0{index + 1}</span><span className="category-symbol">{category.icon}</span><span className="category-title">{category.name}</span><ArrowUpRight size={16} className="category-arrow" /></Link>)}</div><div className="category-foot"><span><span className="live-dot" /> YOUR CURIOSITY SETS THE CURRICULUM</span><Link to="/explore">See what people are sharing <ChevronRight size={15} /></Link></div></section>

      <section className="closing-section"><div className="closing-decoration">s.</div><div className="closing-copy"><div className="eyebrow">THIS IS YOUR INVITATION</div><h2>Let's make learning<br /><em>something we do together.</em></h2><p>Find your people. Share what you know. See where a little curiosity can take you.</p><Link className="button button-light button-large" to="/register">Find your place here <ArrowRight size={17} /></Link><span className="closing-footnote">A COMMUNITY PROJECT BY HACKER_RUN</span></div><div className="closing-lines"><span /><span /><span /></div></section>
    </main>
    <footer className="marketing-footer"><Brand small /><span>Learn together. Grow together.</span><div><Link to="/about">About</Link><Link to="/explore">Explore</Link><Link to="/register">Get involved</Link></div><small>© 2026 HACKER_RUN</small></footer>
  </div>
}
