# SkillScout — AI Recruitment SaaS

Enterprise-grade, multi-tenant recruitment & ATS platform with an AI-assisted candidate evaluation pipeline.
**Math ranks. AI explains. You decide.**

Deterministic scoring models rank candidates; a locally hosted LLM (zero API cost) explains the ranking — transparent, consistent, auditable AI for hiring.

---

## ✨ Product

| Capability | Description |
|------------|-------------|
| **Multi-tenant organizations** | Isolated org workspaces with recruiter verification workflows |
| **Secure auth** | JWT with HTTP-only cookies (SimpleJWT) |
| **RBAC** | Admin · Recruiter · Hiring Manager · Interviewer roles |
| **Job & application workflows** | Job posting, candidate tracking pipelines, status management |
| **Resume intelligence** | Upload, storage (Supabase), automated parsing, structured extraction |
| **Semantic matching** | Embedding-based candidate–job matching with hybrid scoring (BAAI/bge-small-en-v1.5) |
| **AI recruiter insights** | LLM-generated explanations & interview assistance via local Ollama (Qwen2.5-Coder) |

## 🏗️ Architecture

```
┌─────────────────┐     ┌──────────────────────┐     ┌────────────────┐
│ Next.js 16 + TS │────▶│  Django REST (v1 API) │────▶│  PostgreSQL    │
│ Tailwind/shadcn │     │  SimpleJWT · RBAC     │     │  (Supabase)    │
└─────────────────┘     └──────────┬───────────┘     └────────────────┘
                                   │
                    ┌──────────────┼──────────────┐
                    ▼              ▼              ▼
             ┌────────────┐ ┌────────────┐ ┌──────────────┐
             │ Celery +   │ │  Ollama    │ │  Supabase    │
             │ Redis queue│ │ local LLM  │ │  Storage     │
             └────────────┘ └────────────┘ └──────────────┘
```

**Design principle — "Math decides, AI explains":** ranking is produced by deterministic, reproducible scoring (semantic similarity + hybrid signals), and the LLM is used only to generate human-readable explanations — no black-box hiring decisions.

## 🧰 Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 · TypeScript · TailwindCSS · shadcn/ui |
| Backend | Django 5.x · Django REST Framework · SimpleJWT |
| Database | PostgreSQL (Supabase-managed in production) |
| Task queue | Celery + Redis |
| Local AI | Ollama · Qwen2.5-Coder:7B · BAAI/bge-small-en-v1.5 |
| Testing & QA | pytest · Playwright · CodeRabbit · pre-commit (ruff, ESLint, Prettier) |
| CI/CD & Deploy | GitHub Actions · Docker · Railway (API) · Vercel (frontend) |

## 🚦 Build Status

Actively developed (solo) in documented sprints — each sprint ships reviewed, tested code with ADRs.

| Sprint | Status | Focus |
|--------|--------|-------|
| 1 | ✅ Complete | Foundation — project structure, DX, base models, JWT config, CI |
| 2 | 🔨 In progress | Authentication — login, register, JWT cookie flows |
| 3 | 📋 Planned | Organizations + Jobs domain |
| 4+ | 📋 Planned | Candidates, AI evaluation pipeline, pipeline management, analytics |

Full architecture, ADRs, and sprint docs live in [`raw/`](raw/) — system overview, auth strategy, environment setup, and decision records.

## 🚀 Quick Start

### 1. Environment

```bash
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
# Set DJANGO_SECRET_KEY:
python -c "import secrets; print(secrets.token_urlsafe(50))"
```

### 2. Docker (recommended)

```bash
docker compose up --build
docker compose exec django python manage.py migrate
```

### 3. Or run locally

```bash
# Backend
cd backend && python -m venv .venv && .venv/Scripts/activate
pip install -r requirements.txt && python manage.py migrate && python manage.py runserver

# Frontend
cd frontend && npm install && npm run dev
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000/api/v1/ |
| Health check | http://localhost:8000/api/v1/health/ |

## 🧪 Development

```bash
# Backend                      # Frontend
pytest                         npm run lint
ruff check . && ruff format .  npm run type-check
pre-commit run --all-files     npm run format
```

## 📁 Repository Layout

```
backend/        Django API — apps, config, migrations
frontend/       Next.js — app router, components, types
supabase/       Supabase local dev config
infrastructure/ Docker, deployment support files
raw/            Architecture docs, ADRs, sprint plans
wiki/           Obsidian knowledge base
```

---

**Author:** [Parthiv A M](https://github.com/Paaarthiv) · [LinkedIn](https://www.linkedin.com/in/parthivam) — Full Stack Developer (Python · Django · React · Next.js | AI/LLM Integration)
