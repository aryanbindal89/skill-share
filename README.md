# SkillShare

**Learn together. Grow together.** A peer learning community and personal roadmap builder by **HACKER_RUN**.

SkillShare is a full-stack React and Django application. Students can opt into a public learner directory, share skills, request and schedule peer sessions, build and save learning roadmaps, and record their progress. The 3D learning map on the home page is rendered with Three.js through React Three Fiber.

## What works

- Session-based account registration, email-or-username login, logout, CSRF protection, password validation, and Django password hashing.
- Private-by-default profiles. A learner chooses whether to appear publicly, then can maintain a bio, skills to share or learn, interests, experience, and preferred learning formats.
- Searchable skill catalog, category filters, learner discovery, experience and teaching/learning filters, and paginated results.
- Learning requests with topic, note, and suggested future time. The recipient can accept or decline; the sender can cancel a pending request; participants can record attendance after the agreed time.
- Roadmap generation through a configurable OpenAI-compatible chat completions endpoint. With no key or when the provider is unavailable, a deterministic local fallback still creates a usable plan. Roadmaps and task completion persist in Django.
- Progress derived from completed roadmap tasks, learner-recorded practice, and session attendance. No demo statistics are shown as a user's real activity.
- Dark and light themes across routes, stored in local storage and initialized from the operating system preference.
- Responsive routes, keyboard-accessible controls, reduced-motion handling, animated transitions, loading/error/empty states, and a WebGL loading fallback.
- Django admin for the main models. An optional management command creates clearly labeled demo learner profiles; none are created automatically.

Sessions coordinate a topic and a time; SkillShare does not host video calls. Roadmap items are recommendations and do not guarantee a particular outcome.

## Run locally

Use Python 3.12 or later and Node.js 20 or later. SQLite is included with Python; no paid API or external database is required for the local demo.

### 1. Install and configure Django

From the repository root, in PowerShell:

```powershell
py -3 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
Copy-Item backend\.env.example backend\.env
```

The example file runs in local development with SQLite and no AI credential. Edit `backend\.env` only if you want provider-backed roadmap suggestions. Keep real credentials in that ignored file or environment variables; do not put them in source files.

```powershell
python backend\manage.py migrate
python backend\manage.py runserver 8000
```

### 2. Install and start the frontend

Open a second terminal at the repository root:

```powershell
npm install
npm run dev
```

Open the Vite URL printed by npm (normally `http://localhost:5173`). Vite proxies `/api` and `/admin` to Django on port 8000, so browser requests use the same origin and Django session cookies.

### Optional demo accounts

The default database contains a starter skills catalog but no fabricated student accounts. To populate the learner directory with four clearly labeled sample profiles, run this explicitly after migrations:

```powershell
python backend\manage.py seed_demo --password "Choose-A-Unique-Demo-Password"
```

The command creates `demo_mentor`, `demo_designer`, `demo_builder`, and `demo_learner`, each visibly labeled as a demo learner and using reserved `.invalid` email addresses. Use the password you supplied. Run it only in a demo database, never against production accounts.

### Admin account

To manage records in Django admin, create your own administrator:

```powershell
python backend\manage.py createsuperuser
```

Then visit `http://localhost:8000/admin/`.

## AI roadmap settings

The backend reads `AI_API_KEY`, `AI_BASE_URL`, and `AI_MODEL` from environment variables or `backend/.env`. The default URL is the OpenAI-compatible chat completions endpoint. Credentials remain on the backend. When no credential is set, provider requests fail, or the response cannot be parsed, SkillShare creates a structured deterministic roadmap locally and marks it as a local recommendation.

## Database options

SQLite is the default. PostgreSQL can be selected with `DB_ENGINE=postgresql` and `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, and `DB_PORT`; the PostgreSQL driver is included in `requirements.txt`. Run the same Django migrations against the chosen database.

## Useful commands

```powershell
python backend\manage.py check
python backend\manage.py test core
npm run build
npm run lint
```

`npm run backend`, `npm run migrate`, and `npm run test:backend` are also available from an activated Python virtual environment.

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Home and interactive 3D skill map |
| `/explore` | Search and filter the skill catalog |
| `/students` | Browse opted-in learner profiles |
| `/students/:id` | Public learner details and session request form |
| `/register`, `/login` | Account creation and sign-in |
| `/setup`, `/profile` | Profile, skills, interests, learning formats, and visibility |
| `/dashboard` | Personal overview, roadmap, skills, and sessions |
| `/roadmaps/new` | Build and save a learning roadmap |
| `/roadmaps/:id` | Reopen a roadmap, edit its details, and track tasks |
| `/sessions` | Incoming/outgoing requests, confirmed sessions, attendance |
| `/progress` | Recorded learning activity and roadmap progress |
| `/about` | Product mission and HACKER_RUN team |

## API outline

- `POST /api/auth/register/`, `POST /api/auth/login/`, `POST /api/auth/logout/`, `GET /api/auth/me/`
- `GET/PATCH /api/profile/me/`
- `GET /api/skills/`, `GET /api/skills/categories/`, `GET /api/students/`, `GET /api/students/<user_id>/`
- `GET/POST /api/learning-requests/`, `PATCH /api/learning-requests/<id>/`, `GET /api/sessions/`
- `GET /api/roadmaps/`, `POST /api/roadmaps/generate/`, `GET/PATCH/DELETE /api/roadmaps/<id>/`, `PATCH /api/roadmaps/<id>/tasks/<task_id>/`
- `GET /api/progress/`, `POST /api/progress/practice/`

## Before production

Set a unique `DJANGO_SECRET_KEY`, `DJANGO_DEBUG=false`, correct `DJANGO_ALLOWED_HOSTS`, `DJANGO_CORS_ALLOWED_ORIGINS`, and `DJANGO_CSRF_TRUSTED_ORIGINS`; serve over HTTPS; configure a supported production database and backups; and deploy the Vite build behind a web server with `/api` and `/admin` routed to Django. Production cookie security flags are enabled when debug is off. This demo does not include email verification, password reset, hosted video, or a production deployment pipeline.
