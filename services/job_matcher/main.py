import os, re
from datetime import datetime
from typing import List, Optional
from collections import Counter

from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from pydantic import BaseModel
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")

app = FastAPI(title="Job Matcher", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

mongo_client = AsyncIOMotorClient(MONGO_URL)
db = mongo_client["jat"]

SKILLS_DICT = {
    "python","javascript","typescript","java","go","rust","c++","c#","ruby","php","swift","kotlin","scala",
    "react","vue","angular","next.js","nuxt","svelte","fastapi","django","flask","spring","express","node.js",
    "react query","redux","tailwind","bootstrap","graphql","rest","grpc",
    "sql","postgresql","mysql","mongodb","redis","elasticsearch","pandas","numpy","scikit-learn","tensorflow",
    "pytorch","keras","spark","kafka","airflow","dbt","powerbi","tableau",
    "docker","kubernetes","terraform","ansible","aws","gcp","azure","ci/cd","github actions","jenkins",
    "linux","bash","nginx","prometheus","grafana","git","microservices","tdd","system design","api design","nosql",
}

NICE_PHRASES = ["nice to have", "plus", "bonus", "preferred", "good to have", "desirable"]


class MatchRequest(BaseModel):
    resume_id:      str
    application_id: str
    jd_text:        str


def split_jd(text: str):
    lower = text.lower()
    for phrase in NICE_PHRASES:
        idx = lower.find(phrase)
        if idx != -1:
            return text[:idx], text[idx:]
    return text, ""

def extract_skills(text: str) -> List[str]:
    lower = text.lower()
    return sorted(s for s in SKILLS_DICT if re.search(r'\b' + re.escape(s) + r'\b', lower))

def extract_years(text: str) -> Optional[int]:
    m = re.search(r'(\d+)\+?\s+years?', text, re.IGNORECASE)
    return int(m.group(1)) if m else None

def tfidf_score(resume_text: str, jd_text: str) -> float:
    try:
        vec    = TfidfVectorizer(stop_words="english", ngram_range=(1, 2))
        matrix = vec.fit_transform([resume_text, jd_text])
        return round(float(cosine_similarity(matrix[0:1], matrix[1:2])[0][0]) * 100, 1)
    except Exception:
        return 0.0

def skill_score(resume_skills: List[str], required: List[str]) -> float:
    if not required:
        return 100.0
    matched = [s for s in required if s in resume_skills]
    return round(len(matched) / len(required) * 100, 1)


@app.post("/match")
async def match_resume(body: MatchRequest, x_user_id: str = Header(...)):
    resume_doc = await db.resumes.find_one({"_id": ObjectId(body.resume_id), "user_id": x_user_id})
    if not resume_doc:
        raise HTTPException(status_code=404, detail="Resume not found")

    resume_skills = resume_doc["parsed"].get("skills", [])
    raw_text      = resume_doc.get("raw_text", " ".join(resume_skills))

    req_section, nice_section = split_jd(body.jd_text)
    required_skills = extract_skills(req_section)
    nice_skills     = extract_skills(nice_section)
    exp_years       = extract_years(body.jd_text)

    sem_score  = tfidf_score(raw_text, body.jd_text)
    sk_score   = skill_score(resume_skills, required_skills)
    final      = round(sk_score * 0.6 + sem_score * 0.4, 1)

    matched  = [s for s in required_skills if s in resume_skills]
    missing  = [s for s in required_skills if s not in resume_skills]
    nice_hit = [s for s in nice_skills     if s in resume_skills]

    jd_doc = {
        "application_id": body.application_id, "user_id": x_user_id,
        "raw_text": body.jd_text,
        "parsed": {"required_skills": required_skills, "nice_to_have_skills": nice_skills, "experience_years": exp_years},
        "created_at": datetime.utcnow(),
    }
    await db.job_descriptions.replace_one({"application_id": body.application_id}, jd_doc, upsert=True)
    await db.applications.update_one(
        {"_id": ObjectId(body.application_id), "user_id": x_user_id},
        {"$set": {"match_score": final, "skill_gaps": missing, "updated_at": datetime.utcnow()}}
    )

    return {
        "match_score": final, "skill_score": sk_score, "semantic_score": sem_score,
        "matched_skills": matched, "missing_skills": missing, "nice_to_have_matched": nice_hit,
        "total_required": len(required_skills),
    }

@app.get("/gaps/{application_id}")
async def get_gaps(application_id: str, x_user_id: str = Header(...)):
    jd = await db.job_descriptions.find_one({"application_id": application_id, "user_id": x_user_id})
    if not jd:
        raise HTTPException(status_code=404, detail="No JD found for this application")
    app_doc = await db.applications.find_one({"_id": ObjectId(application_id), "user_id": x_user_id})
    return {
        "application_id":   application_id,
        "match_score":      app_doc.get("match_score") if app_doc else None,
        "skill_gaps":       app_doc.get("skill_gaps", []) if app_doc else [],
        "required_skills":  jd["parsed"]["required_skills"],
        "nice_to_have":     jd["parsed"]["nice_to_have_skills"],
        "experience_years": jd["parsed"]["experience_years"],
    }

@app.get("/dashboard/skills")
async def skill_dashboard(x_user_id: str = Header(...)):
    cursor       = db.job_descriptions.find({"user_id": x_user_id})
    all_required = []
    all_nice     = []
    all_missing  = []
    async for jd in cursor:
        all_required.extend(jd["parsed"].get("required_skills", []))
        all_nice.extend(jd["parsed"].get("nice_to_have_skills", []))
        app_doc = await db.applications.find_one({"_id": ObjectId(jd["application_id"])})
        if app_doc:
            all_missing.extend(app_doc.get("skill_gaps", []))
    return {
        "most_demanded":       Counter(all_required).most_common(15),
        "most_missing":        Counter(all_missing).most_common(10),
        "nice_to_have_common": Counter(all_nice).most_common(10),
        "total_jds_analyzed":  len(all_required),
    }

@app.get("/health")
async def health():
    return {"status": "ok", "service": "job_matcher"}
