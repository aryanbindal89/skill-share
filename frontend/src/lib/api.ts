export type User = { id: number; username: string; email: string }
export type SkillCategory = { id: number; name: string; slug: string }
export type Skill = { id: number; name: string; slug: string; category: SkillCategory; description: string; teachers_count: number; learners_count: number }
export type UserSkill = { id: number; skill: Skill; direction: 'teach' | 'learn' | 'both'; level: string }
export type Profile = { id: number; user_id?: number; username: string; display_name: string; bio: string; experience_level: string; learning_goal: string; interests: string[]; preferred_formats: string[]; is_public?: boolean; skills: UserSkill[] }
export type Student = Profile & { user_id: number }
export type RoadmapTask = { id: number; phase: string; title: string; description: string; project: string; prerequisites: string[]; estimated_hours: number; order: number; completed_at: string | null }
export type Roadmap = { id: number; title: string; target: string; current_level: string; hours_per_week: number; learning_style: string; target_weeks: number; known_skills: string[]; areas_of_interest: string[]; generated_by: 'provider' | 'fallback'; created_at: string; updated_at: string; tasks: RoadmapTask[]; progress: number; completed_tasks: number; total_tasks: number }
export type LearningRequest = { id: number; sender: number; sender_name: string; recipient: number; recipient_name: string; skill: number; skill_name: string; topic: string; message: string; suggested_at: string; status: 'pending' | 'accepted' | 'completed' | 'declined' | 'cancelled'; created_at: string }
export type Progress = { completed_tasks: number; total_tasks: number; remaining_tasks: number; progress: number; sessions_attended: number; current_streak: number; skills_practiced: string[]; recent_activity: { id: number; kind: string; created_at: string; task__title: string | null; skill__name: string | null }[] }

type ApiError = Error & { fields?: Record<string, string[]> }
let csrfReady = false

function csrfToken() {
  return document.cookie.split('; ').find((row) => row.startsWith('csrftoken='))?.split('=')[1]
}

export async function primeCsrf() {
  if (csrfReady && csrfToken()) return
  await fetch('/api/csrf/', { credentials: 'include' })
  csrfReady = true
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const method = (options.method || 'GET').toUpperCase()
  if (!['GET', 'HEAD', 'OPTIONS', 'TRACE'].includes(method)) await primeCsrf()
  const headers = new Headers(options.headers)
  if (options.body && !(options.body instanceof FormData)) headers.set('Content-Type', 'application/json')
  if (!['GET', 'HEAD', 'OPTIONS', 'TRACE'].includes(method)) {
    const token = csrfToken()
    if (token) headers.set('X-CSRFToken', decodeURIComponent(token))
  }
  const response = await fetch(`/api${path}`, { ...options, method, headers, credentials: 'include' })
  if (response.status === 204) return undefined as T
  const body = await response.json().catch(() => ({}))
  if (!response.ok) {
    const fields = body as Record<string, unknown>
    const message = typeof fields.detail === 'string' ? fields.detail : Object.values(fields).flatMap((value) => Array.isArray(value) ? value : []).join(' ') || 'Something went wrong. Please try again.'
    const error = new Error(message) as ApiError
    error.fields = Object.fromEntries(Object.entries(fields).filter(([, value]) => Array.isArray(value)) as [string, string[]][])
    throw error
  }
  return body as T
}

export const authApi = {
  me: () => api<User>('/auth/me/'),
  login: (username: string, password: string) => api<User>('/auth/login/', { method: 'POST', body: JSON.stringify({ username, password }) }),
  register: (username: string, email: string, password: string) => api<User>('/auth/register/', { method: 'POST', body: JSON.stringify({ username, email, password }) }),
  logout: () => api<{ detail: string }>('/auth/logout/', { method: 'POST' }),
}
