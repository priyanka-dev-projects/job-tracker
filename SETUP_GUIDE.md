# JobTracker — Complete Setup Guide

## What you're building

A full-stack job application tracker with:
- 4 Python FastAPI microservices: API Gateway, Resume Parser, Job Matcher, Application Manager
- React 18 frontend with drag-and-drop Kanban board
- MongoDB for data storage, MinIO for resume file storage
- Docker Compose orchestrating everything

---

## Project structure

```
jat/
├── docker-compose.yml
├── .env.example                ← copy to .env and edit
├── services/
│   ├── api_gateway/            ← JWT auth + request routing
│   ├── resume_parser/          ← PDF/DOCX parsing + NLP skill extraction
│   ├── job_matcher/            ← TF-IDF match scoring + gap analysis
│   └── app_manager/            ← Kanban CRUD + status timeline
├── frontend/
│   ├── src/
│   │   ├── App.js              ← router + auth context
│   │   ├── api/client.js       ← axios + auth interceptors
│   │   ├── components/Layout.js
│   │   └── pages/
│   │       ├── LoginPage.js
│   │       ├── RegisterPage.js
│   │       ├── DashboardPage.js
│   │       ├── KanbanPage.js   ← drag-and-drop board
│   │       ├── ResumePage.js   ← upload + view parsed data
│   │       ├── AppDetailPage.js ← JD matcher + skill breakdown
│   │       └── SkillsPage.js   ← aggregated skill gap dashboard
│   ├── public/index.html
│   ├── package.json
│   ├── Dockerfile
│   └── nginx.conf
└── scripts/
    └── setup_indexes.js        ← MongoDB indexes
```

---

## Prerequisites

| Tool           | Notes                         |
|----------------|-------------------------------|
| Docker Desktop | https://docs.docker.com       |
| Node.js 18+    | Only needed for local dev     |
| Python 3.11+   | Only needed for local dev     |

---

## Step 1 — Set up environment variables

```bash
cd jat
cp .env.example .env
```

Edit `.env` and set a strong SECRET_KEY:
```bash
python -c "import secrets; print(secrets.token_hex(32))"
# paste output as SECRET_KEY=...
```

---

## Step 2 — Build and start everything

```bash
docker compose up --build
```

First build takes 5–10 minutes (downloads spaCy model ~50MB, installs all deps).
Subsequent starts are fast.

Run in background:
```bash
docker compose up --build -d
```

---

## Step 3 — Verify services

```bash
docker compose ps
```

| Container         | Port  |
|-------------------|-------|
| jat_mongo         | 27017 |
| jat_minio         | 9000  |
| jat_gateway       | 8000  |
| jat_resume_parser | 8001  |
| jat_job_matcher   | 8002  |
| jat_app_manager   | 8003  |
| jat_frontend      | 3000  |

Health checks:
```bash
curl http://localhost:8000/health
curl http://localhost:8001/health
curl http://localhost:8002/health
curl http://localhost:8003/health
```

---

## Step 4 — Create MongoDB indexes

```bash
docker exec -it jat_mongo mongosh \
  "mongodb://jat_user:jat_pass@localhost:27017/jat" \
  --eval "
    db.users.createIndex({ email: 1 }, { unique: true });
    db.resumes.createIndex({ user_id: 1, created_at: -1 });
    db.applications.createIndex({ user_id: 1, status: 1 });
    db.applications.createIndex({ user_id: 1, updated_at: -1 });
    db.job_descriptions.createIndex({ application_id: 1 }, { unique: true });
    print('Indexes created');
  "
```

---

## Step 5 — Open the app

**http://localhost:3000**

1. **Register** — create your account
2. **My Resumes** — upload a PDF or DOCX resume
3. **Applications** — click "Add" to create your first application
4. **Open an application** — paste a job description → click "Analyze match"
5. **Skill Gaps** — see aggregated insights across all your JDs

---

## API docs (Swagger UI)

- Gateway:      http://localhost:8000/docs
- Resume Parser: http://localhost:8001/docs
- Job Matcher:  http://localhost:8002/docs
- App Manager:  http://localhost:8003/docs

---

## MinIO console (file storage)

http://localhost:9001  
Username: `minioadmin` / Password: `minioadmin`

---

## Local development (without Docker)

Start MongoDB and MinIO via Docker only:
```bash
docker run -d -p 27017:27017 -e MONGO_INITDB_ROOT_USERNAME=jat_user -e MONGO_INITDB_ROOT_PASSWORD=jat_pass mongo:7
docker run -d -p 9000:9000 -p 9001:9001 -e MINIO_ROOT_USER=minioadmin -e MINIO_ROOT_PASSWORD=minioadmin minio/minio server /data --console-address ":9001"
```

Start each service:
```bash
# API Gateway (port 8000)
cd services/api_gateway && pip install -r requirements.txt
SECRET_KEY=dev MONGO_URL=mongodb://jat_user:jat_pass@localhost:27017 uvicorn main:app --port 8000 --reload

# Resume Parser (port 8001)
cd services/resume_parser && pip install -r requirements.txt && python -m spacy download en_core_web_sm
MONGO_URL=mongodb://jat_user:jat_pass@localhost:27017 MINIO_URL=localhost:9000 MINIO_ACCESS_KEY=minioadmin MINIO_SECRET_KEY=minioadmin uvicorn main:app --port 8001 --reload

# Job Matcher (port 8002)
cd services/job_matcher && pip install -r requirements.txt
MONGO_URL=mongodb://jat_user:jat_pass@localhost:27017 uvicorn main:app --port 8002 --reload

# App Manager (port 8003)
cd services/app_manager && pip install -r requirements.txt
MONGO_URL=mongodb://jat_user:jat_pass@localhost:27017 uvicorn main:app --port 8003 --reload
```

Start the frontend:
```bash
cd frontend && npm install
REACT_APP_API_URL=http://localhost:8000 npm start
```

---

## Common issues

**Service won't start**
```bash
docker compose logs <service_name>   # e.g. docker compose logs resume_parser
```

**Resume upload fails**
- Image-only scanned PDFs won't work (no text layer) — use a text-based PDF or DOCX
- Check: `docker compose logs resume_parser`

**spaCy model missing**
```bash
docker compose build resume_parser
docker compose up -d resume_parser
```

**Port already in use**
Edit `docker-compose.yml` and change the host port:
```yaml
ports:
  - "8100:8000"   # use 8100 instead of 8000
```

**Full reset (delete all data)**
```bash
docker compose down -v
```

---

## Stop the app

```bash
docker compose down          # stops containers, keeps data
docker compose down -v       # stops containers + deletes all data
```

---

## Architecture

```
Browser → React (port 3000)
              │
        API Gateway :8000  ← JWT auth lives here
         ┌────┴────┐────────────┐
  Resume Parser  App Manager  Job Matcher
     :8001          :8003         :8002
         └────────────┴────────────┘
                      │
               MongoDB :27017
                      │
               MinIO  :9000  ← resume files
```

All backend-to-backend calls are internal Docker networking. Only the gateway is exposed to the frontend.

---

## Phase 2 roadmap (AI features)

The data pipeline is already in place — resumes and JDs are stored as clean structured JSON.

Planned additions:
- **Resume rewriter** — AI rewrites your bullet points to better match a specific JD
- **Cover letter generator** — drafts a tailored cover letter from resume + JD
- **Interview prep** — generates likely questions based on the JD + your resume gaps
- **Application success predictor** — trains on your historical outcomes

To add a new AI service: create `services/ai_service/`, add it to `docker-compose.yml`, and add proxy routes in the API Gateway.
