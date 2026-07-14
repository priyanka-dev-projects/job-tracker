# import os, re
# from datetime import datetime
# from typing import List, Optional
# from collections import Counter

# from fastapi import FastAPI, HTTPException, Header
# from fastapi.middleware.cors import CORSMiddleware
# from motor.motor_asyncio import AsyncIOMotorClient
# from bson import ObjectId
# from pydantic import BaseModel
# from sklearn.feature_extraction.text import TfidfVectorizer
# from sklearn.metrics.pairwise import cosine_similarity

# MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")

# app = FastAPI(title="Job Matcher", version="1.0.0")
# app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# mongo_client = AsyncIOMotorClient(MONGO_URL)
# db = mongo_client["jat"]

# SKILLS_DICT = {
#     "python","javascript","typescript","java","go","rust","c++","c#","ruby","php","swift","kotlin","scala",
#     "react","vue","angular","next.js","nuxt","svelte","fastapi","django","flask","spring","express","node.js",
#     "react query","redux","tailwind","bootstrap","graphql","rest","grpc",
#     "sql","postgresql","mysql","mongodb","redis","elasticsearch","pandas","numpy","scikit-learn","tensorflow",
#     "pytorch","keras","spark","kafka","airflow","dbt","powerbi","tableau",
#     "docker","kubernetes","terraform","ansible","aws","gcp","azure","ci/cd","github actions","jenkins",
#     "linux","bash","nginx","prometheus","grafana","git","microservices","tdd","system design","api design","nosql",
# }

# NICE_PHRASES = ["nice to have", "plus", "bonus", "preferred", "good to have", "desirable"]


# class MatchRequest(BaseModel):
#     resume_id:      str
#     application_id: str
#     jd_text:        str


# def split_jd(text: str):
#     lower = text.lower()
#     for phrase in NICE_PHRASES:
#         idx = lower.find(phrase)
#         if idx != -1:
#             return text[:idx], text[idx:]
#     return text, ""

# def extract_skills(text: str) -> List[str]:
#     lower = text.lower()
#     return sorted(s for s in SKILLS_DICT if re.search(r'\b' + re.escape(s) + r'\b', lower))

# def extract_years(text: str) -> Optional[int]:
#     m = re.search(r'(\d+)\+?\s+years?', text, re.IGNORECASE)
#     return int(m.group(1)) if m else None

# def tfidf_score(resume_text: str, jd_text: str) -> float:
#     try:
#         vec    = TfidfVectorizer(stop_words="english", ngram_range=(1, 2))
#         matrix = vec.fit_transform([resume_text, jd_text])
#         return round(float(cosine_similarity(matrix[0:1], matrix[1:2])[0][0]) * 100, 1)
#     except Exception:
#         return 0.0

# def skill_score(resume_skills: List[str], required: List[str]) -> float:
#     if not required:
#         return 100.0
#     matched = [s for s in required if s in resume_skills]
#     return round(len(matched) / len(required) * 100, 1)


# @app.post("/match")
# async def match_resume(body: MatchRequest, x_user_id: str = Header(...)):
#     resume_doc = await db.resumes.find_one({"_id": ObjectId(body.resume_id), "user_id": x_user_id})
#     if not resume_doc:
#         raise HTTPException(status_code=404, detail="Resume not found")

#     resume_skills = resume_doc["parsed"].get("skills", [])
#     raw_text      = resume_doc.get("raw_text", " ".join(resume_skills))

#     req_section, nice_section = split_jd(body.jd_text)
#     required_skills = extract_skills(req_section)
#     nice_skills     = extract_skills(nice_section)
#     exp_years       = extract_years(body.jd_text)

#     sem_score  = tfidf_score(raw_text, body.jd_text)
#     sk_score   = skill_score(resume_skills, required_skills)
#     final      = round(sk_score * 0.6 + sem_score * 0.4, 1)

#     matched  = [s for s in required_skills if s in resume_skills]
#     missing  = [s for s in required_skills if s not in resume_skills]
#     nice_hit = [s for s in nice_skills     if s in resume_skills]

#     jd_doc = {
#         "application_id": body.application_id, "user_id": x_user_id,
#         "raw_text": body.jd_text,
#         "parsed": {"required_skills": required_skills, "nice_to_have_skills": nice_skills, "experience_years": exp_years},
#         "created_at": datetime.utcnow(),
#     }
#     await db.job_descriptions.replace_one({"application_id": body.application_id}, jd_doc, upsert=True)
#     await db.applications.update_one(
#         {"_id": ObjectId(body.application_id), "user_id": x_user_id},
#         {"$set": {"match_score": final, "skill_gaps": missing, "updated_at": datetime.utcnow()}}
#     )

#     return {
#         "match_score": final, "skill_score": sk_score, "semantic_score": sem_score,
#         "matched_skills": matched, "missing_skills": missing, "nice_to_have_matched": nice_hit,
#         "total_required": len(required_skills),
#     }

# @app.get("/gaps/{application_id}")
# async def get_gaps(application_id: str, x_user_id: str = Header(...)):
#     jd = await db.job_descriptions.find_one({"application_id": application_id, "user_id": x_user_id})
#     if not jd:
#         raise HTTPException(status_code=404, detail="No JD found for this application")
#     app_doc = await db.applications.find_one({"_id": ObjectId(application_id), "user_id": x_user_id})
#     return {
#         "application_id":   application_id,
#         "match_score":      app_doc.get("match_score") if app_doc else None,
#         "skill_gaps":       app_doc.get("skill_gaps", []) if app_doc else [],
#         "required_skills":  jd["parsed"]["required_skills"],
#         "nice_to_have":     jd["parsed"]["nice_to_have_skills"],
#         "experience_years": jd["parsed"]["experience_years"],
#     }

# @app.get("/dashboard/skills")
# async def skill_dashboard(x_user_id: str = Header(...)):
#     cursor       = db.job_descriptions.find({"user_id": x_user_id})
#     all_required = []
#     all_nice     = []
#     all_missing  = []
#     async for jd in cursor:
#         all_required.extend(jd["parsed"].get("required_skills", []))
#         all_nice.extend(jd["parsed"].get("nice_to_have_skills", []))
#         app_doc = await db.applications.find_one({"_id": ObjectId(jd["application_id"])})
#         if app_doc:
#             all_missing.extend(app_doc.get("skill_gaps", []))
#     return {
#         "most_demanded":       Counter(all_required).most_common(15),
#         "most_missing":        Counter(all_missing).most_common(10),
#         "nice_to_have_common": Counter(all_nice).most_common(10),
#         "total_jds_analyzed":  len(all_required),
#     }

# @app.get("/health")
# async def health():
#     return {"status": "ok", "service": "job_matcher"}


import os
import re

from datetime import datetime, timezone
from typing import List, Optional
from collections import Counter

from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware

from motor.motor_asyncio import AsyncIOMotorClient

from bson import ObjectId
from bson.errors import InvalidId

from pydantic import BaseModel

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


# ============================================================
# CONFIGURATION
# ============================================================

MONGO_URL = os.getenv(
    "MONGO_URL",
    "mongodb://localhost:27017",
)


app = FastAPI(
    title="Job Matcher",
    version="1.1.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


mongo_client = AsyncIOMotorClient(MONGO_URL)

db = mongo_client["jat"]


# ============================================================
# SKILLS DICTIONARY
# ============================================================

SKILLS_DICT = {
    "python",
    "javascript",
    "typescript",
    "java",
    "go",
    "rust",
    "c++",
    "c#",
    "ruby",
    "php",
    "swift",
    "kotlin",
    "scala",

    "react",
    "vue",
    "angular",
    "next.js",
    "nuxt",
    "svelte",

    "fastapi",
    "django",
    "flask",
    "spring",
    "spring boot",
    "express",
    "node.js",

    "react query",
    "redux",
    "tailwind",
    "bootstrap",

    "graphql",
    "rest",
    "rest api",
    "grpc",

    "sql",
    "postgresql",
    "mysql",
    "mongodb",
    "redis",
    "elasticsearch",

    "pandas",
    "numpy",
    "scikit-learn",
    "tensorflow",
    "pytorch",
    "keras",
    "spark",
    "kafka",
    "airflow",
    "dbt",

    "powerbi",
    "tableau",

    "docker",
    "kubernetes",
    "terraform",
    "ansible",

    "aws",
    "gcp",
    "azure",

    "ci/cd",
    "github actions",
    "jenkins",

    "linux",
    "bash",
    "nginx",

    "prometheus",
    "grafana",

    "git",

    "microservices",
    "tdd",
    "system design",
    "api design",
    "nosql",
}


# ============================================================
# SKILL ALIASES
# ============================================================

SKILL_ALIASES = {
    # JavaScript
    "js": "javascript",
    "javascript": "javascript",

    # TypeScript
    "ts": "typescript",
    "typescript": "typescript",

    # React
    "react": "react",
    "react.js": "react",
    "reactjs": "react",

    # Vue
    "vue": "vue",
    "vue.js": "vue",
    "vuejs": "vue",

    # Node
    "node": "node.js",
    "nodejs": "node.js",
    "node.js": "node.js",

    # Next
    "next": "next.js",
    "nextjs": "next.js",
    "next.js": "next.js",

    # Spring
    "spring": "spring",
    "spring framework": "spring",

    # Spring Boot
    "springboot": "spring boot",
    "spring boot": "spring boot",

    # REST
    "rest": "rest",
    "restful": "rest",
    "restful api": "rest",
    "restful apis": "rest",
    "rest api": "rest",
    "rest apis": "rest",

    # PostgreSQL
    "postgres": "postgresql",
    "postgresql": "postgresql",

    # MongoDB
    "mongo": "mongodb",
    "mongodb": "mongodb",

    # Kubernetes
    "k8s": "kubernetes",
    "kubernetes": "kubernetes",

    # AWS
    "amazon web services": "aws",
    "aws": "aws",

    # GCP
    "google cloud": "gcp",
    "google cloud platform": "gcp",
    "gcp": "gcp",

    # CI/CD
    "cicd": "ci/cd",
    "ci cd": "ci/cd",
    "ci/cd": "ci/cd",

    # Git
    "git": "git",

    # GitHub Actions
    "github actions": "github actions",

    # Scikit Learn
    "scikit learn": "scikit-learn",
    "scikit-learn": "scikit-learn",

    # Power BI
    "power bi": "powerbi",
    "powerbi": "powerbi",
}


# ============================================================
# NICE-TO-HAVE PHRASES
# ============================================================

NICE_PHRASES = [
    "nice to have",
    "good to have",
    "preferred qualifications",
    "preferred skills",
    "preferred experience",
    "preferred",
    "bonus",
    "desirable",
    "plus",
]


# ============================================================
# REQUEST MODEL
# ============================================================

class MatchRequest(BaseModel):
    resume_id: str
    application_id: str
    jd_text: str


# ============================================================
# OBJECT ID VALIDATION
# ============================================================

def parse_object_id(value: str, field_name: str) -> ObjectId:

    try:
        return ObjectId(value)

    except (InvalidId, TypeError):

        raise HTTPException(
            status_code=400,
            detail=f"Invalid {field_name}",
        )


# ============================================================
# NORMALIZE SKILL
# ============================================================

def normalize_skill(skill: str) -> str:

    if not isinstance(skill, str):
        return ""

    normalized = skill.lower().strip()

    normalized = re.sub(
        r"\s+",
        " ",
        normalized,
    )

    return SKILL_ALIASES.get(
        normalized,
        normalized,
    )


# ============================================================
# NORMALIZE SKILL LIST
# ============================================================

def normalize_skill_list(skills: List[str]) -> List[str]:

    normalized_skills = set()

    for skill in skills:

        normalized = normalize_skill(skill)

        if normalized:
            normalized_skills.add(normalized)

    return sorted(normalized_skills)


# ============================================================
# SPLIT REQUIRED / NICE-TO-HAVE JD SECTIONS
# ============================================================

def split_jd(text: str):

    lower_text = text.lower()

    matches = []

    for phrase in NICE_PHRASES:

        match = re.search(
            r"\b" + re.escape(phrase) + r"\b",
            lower_text,
        )

        if match:
            matches.append(match.start())

    if not matches:
        return text, ""

    split_index = min(matches)

    return (
        text[:split_index],
        text[split_index:],
    )


# ============================================================
# BUILD SKILL SEARCH PATTERN
# ============================================================

def build_skill_pattern(skill: str):

    escaped = re.escape(skill)

    # Allow flexible whitespace.
    escaped = escaped.replace(
        r"\ ",
        r"\s+",
    )

    return (
        r"(?<![A-Za-z0-9])"
        + escaped
        + r"(?![A-Za-z0-9])"
    )


# ============================================================
# EXTRACT SKILLS
# ============================================================

def extract_skills(text: str) -> List[str]:

    if not text:
        return []

    lower_text = text.lower()

    detected = set()

    # Search canonical dictionary skills.

    for skill in SKILLS_DICT:

        pattern = build_skill_pattern(skill)

        if re.search(pattern, lower_text):

            detected.add(
                normalize_skill(skill)
            )

    # Search aliases too.

    for alias, canonical_skill in SKILL_ALIASES.items():

        pattern = build_skill_pattern(alias)

        if re.search(pattern, lower_text):

            detected.add(
                normalize_skill(canonical_skill)
            )

    return sorted(detected)


# ============================================================
# EXPERIENCE EXTRACTION
# ============================================================

def extract_years(text: str) -> Optional[int]:

    if not text:
        return None

    patterns = [
        r"(\d+)\+?\s+years?",
        r"(\d+)\+?\s+yrs?",
        r"minimum\s+(\d+)\s+years?",
        r"at\s+least\s+(\d+)\s+years?",
    ]

    years_found = []

    for pattern in patterns:

        for match in re.finditer(
            pattern,
            text,
            re.IGNORECASE,
        ):

            years_found.append(
                int(match.group(1))
            )

    if not years_found:
        return None

    return max(years_found)


# ============================================================
# TF-IDF SEMANTIC SCORE
# ============================================================

def tfidf_score(
    resume_text: str,
    jd_text: str,
) -> float:

    if not resume_text.strip():
        return 0.0

    if not jd_text.strip():
        return 0.0

    try:

        vectorizer = TfidfVectorizer(
            stop_words="english",
            ngram_range=(1, 2),
        )

        matrix = vectorizer.fit_transform(
            [
                resume_text,
                jd_text,
            ]
        )

        score = cosine_similarity(
            matrix[0:1],
            matrix[1:2],
        )[0][0]

        return round(
            float(score) * 100,
            1,
        )

    except ValueError:

        return 0.0

    except Exception:

        return 0.0


# ============================================================
# CALCULATE MATCHED / MISSING SKILLS
# ============================================================

def calculate_skill_match(
    resume_skills: List[str],
    required_skills: List[str],
):

    resume_set = set(
        normalize_skill_list(resume_skills)
    )

    required_set = set(
        normalize_skill_list(required_skills)
    )

    matched = sorted(
        required_set.intersection(resume_set)
    )

    missing = sorted(
        required_set.difference(resume_set)
    )

    return matched, missing


# ============================================================
# CALCULATE NICE-TO-HAVE MATCHES
# ============================================================

def calculate_nice_matches(
    resume_skills: List[str],
    nice_skills: List[str],
):

    resume_set = set(
        normalize_skill_list(resume_skills)
    )

    nice_set = set(
        normalize_skill_list(nice_skills)
    )

    return sorted(
        nice_set.intersection(resume_set)
    )


# ============================================================
# SKILL SCORE
# ============================================================

def calculate_skill_score(
    matched_skills: List[str],
    required_skills: List[str],
) -> float:

    required_set = set(
        normalize_skill_list(required_skills)
    )

    if not required_set:
        return 100.0

    matched_set = set(
        normalize_skill_list(matched_skills)
    )

    score = (
        len(matched_set)
        / len(required_set)
        * 100
    )

    return round(score, 1)


# ============================================================
# GENERATE RECOMMENDATION
# ============================================================

def generate_recommendation(
    final_score: float,
    matched_skills: List[str],
    missing_skills: List[str],
):

    if not missing_skills:

        if final_score >= 80:

            return (
                "Excellent match. Your resume contains all detected "
                "required skills and has strong overall similarity "
                "with the job description."
            )

        return (
            "Your resume contains all detected required skills. "
            "Consider tailoring your experience and project descriptions "
            "more closely to the job responsibilities."
        )


    missing_preview = ", ".join(
        missing_skills[:5]
    )


    if final_score >= 80:

        return (
            "Strong match. Your resume satisfies most detected requirements. "
            f"Consider improving or demonstrating experience with "
            f"{missing_preview}."
        )


    if final_score >= 60:

        return (
            "Good match. Your profile contains several required skills, "
            f"but adding evidence of {missing_preview} could improve "
            "your suitability for this role."
        )


    if final_score >= 40:

        return (
            "Moderate match. Several detected requirements are missing. "
            f"Focus on improving or demonstrating {missing_preview}."
        )


    return (
        "Low match. Your resume is missing several detected required skills. "
        f"Consider developing relevant experience with {missing_preview} "
        "before applying."
    )


# ============================================================
# MATCH ENDPOINT
# ============================================================

@app.post("/match")
async def match_resume(
    body: MatchRequest,
    x_user_id: str = Header(...),
):

    # --------------------------------------------------------
    # Validate IDs
    # --------------------------------------------------------

    resume_object_id = parse_object_id(
        body.resume_id,
        "resume_id",
    )

    application_object_id = parse_object_id(
        body.application_id,
        "application_id",
    )


    # --------------------------------------------------------
    # Validate JD
    # --------------------------------------------------------

    jd_text = body.jd_text.strip()

    if not jd_text:

        raise HTTPException(
            status_code=400,
            detail="Job description cannot be empty",
        )


    # --------------------------------------------------------
    # Get Resume
    # --------------------------------------------------------

    resume_doc = await db.resumes.find_one(
        {
            "_id": resume_object_id,
            "user_id": x_user_id,
        }
    )


    if not resume_doc:

        raise HTTPException(
            status_code=404,
            detail="Resume not found",
        )


    # --------------------------------------------------------
    # Get Application
    # --------------------------------------------------------

    application_doc = await db.applications.find_one(
        {
            "_id": application_object_id,
            "user_id": x_user_id,
        }
    )


    if not application_doc:

        raise HTTPException(
            status_code=404,
            detail="Application not found",
        )


    # --------------------------------------------------------
    # Resume Skills
    # --------------------------------------------------------

    parsed_resume = resume_doc.get(
        "parsed",
        {},
    )


    stored_resume_skills = parsed_resume.get(
        "skills",
        [],
    )


    if not isinstance(stored_resume_skills, list):

        stored_resume_skills = []


    raw_text = resume_doc.get(
        "raw_text",
        "",
    )


    # IMPORTANT:
    # Use BOTH parsed skills and skills extracted from raw resume text.
    #
    # This prevents a skill from being marked missing simply because
    # the resume parser failed to add it to parsed.skills.

    raw_resume_skills = extract_skills(
        raw_text
    )


    resume_skills = normalize_skill_list(
        stored_resume_skills
        + raw_resume_skills
    )


    # --------------------------------------------------------
    # Split JD
    # --------------------------------------------------------

    required_section, nice_section = split_jd(
        jd_text
    )


    # --------------------------------------------------------
    # Extract JD Skills
    # --------------------------------------------------------

    required_skills = extract_skills(
        required_section
    )


    nice_skills = extract_skills(
        nice_section
    )


    # A skill must not be both required and nice-to-have.

    required_skill_set = set(
        required_skills
    )


    nice_skills = sorted(
        set(nice_skills)
        - required_skill_set
    )


    # --------------------------------------------------------
    # Extract Experience
    # --------------------------------------------------------

    experience_years = extract_years(
        jd_text
    )


    # --------------------------------------------------------
    # Calculate Skill Match
    # --------------------------------------------------------

    matched_skills, missing_skills = calculate_skill_match(
        resume_skills,
        required_skills,
    )


    # Defensive invariant:
    # A skill can NEVER be in both lists.

    missing_skills = sorted(
        set(missing_skills)
        - set(matched_skills)
    )


    # --------------------------------------------------------
    # Nice-To-Have Matches
    # --------------------------------------------------------

    nice_to_have_matched = calculate_nice_matches(
        resume_skills,
        nice_skills,
    )


    # --------------------------------------------------------
    # Skill Score
    # --------------------------------------------------------

    skill_score = calculate_skill_score(
        matched_skills,
        required_skills,
    )


    # --------------------------------------------------------
    # Semantic Score
    # --------------------------------------------------------

    semantic_score = tfidf_score(
        raw_text,
        jd_text,
    )


    # --------------------------------------------------------
    # Final Score
    # --------------------------------------------------------

    # If the JD contains detected required skills:
    # 70% skills + 30% semantic similarity.
    #
    # If no required skills are detected:
    # Use semantic similarity instead of giving an automatic
    # perfect skill score.

    if required_skills:

        final_score = round(
            skill_score * 0.7
            + semantic_score * 0.3,
            1,
        )

    else:

        final_score = semantic_score


    final_score = max(
        0.0,
        min(100.0, final_score),
    )


    # --------------------------------------------------------
    # Recommendation
    # --------------------------------------------------------

    recommendation = generate_recommendation(
        final_score,
        matched_skills,
        missing_skills,
    )


    # --------------------------------------------------------
    # Current Timestamp
    # --------------------------------------------------------

    now = datetime.now(timezone.utc)


    # --------------------------------------------------------
    # Save JD
    # --------------------------------------------------------

    jd_doc = {

        "application_id":
            body.application_id,

        "user_id":
            x_user_id,

        "raw_text":
            jd_text,

        "parsed": {

            "required_skills":
                required_skills,

            "nice_to_have_skills":
                nice_skills,

            "experience_years":
                experience_years,
        },

        "analysis": {

            "resume_id":
                body.resume_id,

            "resume_skills":
                resume_skills,

            "matched_skills":
                matched_skills,

            "missing_skills":
                missing_skills,

            "nice_to_have_matched":
                nice_to_have_matched,

            "skill_score":
                skill_score,

            "semantic_score":
                semantic_score,

            "match_score":
                final_score,

            "recommendation":
                recommendation,
        },

        "created_at":
            now,

        "updated_at":
            now,
    }


    await db.job_descriptions.replace_one(

        {
            "application_id":
                body.application_id,

            "user_id":
                x_user_id,
        },

        jd_doc,

        upsert=True,
    )


    # --------------------------------------------------------
    # Save Analysis in Application
    # --------------------------------------------------------

    await db.applications.update_one(

        {
            "_id":
                application_object_id,

            "user_id":
                x_user_id,
        },

        {
            "$set": {

                "match_score":
                    final_score,

                "skill_score":
                    skill_score,

                "semantic_score":
                    semantic_score,

                "matched_skills":
                    matched_skills,

                "skill_gaps":
                    missing_skills,

                "nice_to_have_matched":
                    nice_to_have_matched,

                "match_recommendation":
                    recommendation,

                "updated_at":
                    now,
            }
        },
    )


    # --------------------------------------------------------
    # Response
    # --------------------------------------------------------

    return {

        "match_score":
            final_score,

        "skill_score":
            skill_score,

        "semantic_score":
            semantic_score,

        "matched_skills":
            matched_skills,

        "missing_skills":
            missing_skills,

        "nice_to_have_matched":
            nice_to_have_matched,

        "required_skills":
            required_skills,

        "resume_skills":
            resume_skills,

        "total_required":
            len(required_skills),

        "total_matched":
            len(matched_skills),

        "total_missing":
            len(missing_skills),

        "experience_years":
            experience_years,

        "recommendation":
            recommendation,
    }


# ============================================================
# GET SKILL GAPS
# ============================================================

@app.get("/gaps/{application_id}")
async def get_gaps(
    application_id: str,
    x_user_id: str = Header(...),
):

    application_object_id = parse_object_id(
        application_id,
        "application_id",
    )


    jd = await db.job_descriptions.find_one(
        {
            "application_id":
                application_id,

            "user_id":
                x_user_id,
        }
    )


    if not jd:

        raise HTTPException(
            status_code=404,
            detail="No JD found for this application",
        )


    application_doc = await db.applications.find_one(
        {
            "_id":
                application_object_id,

            "user_id":
                x_user_id,
        }
    )


    analysis = jd.get(
        "analysis",
        {},
    )


    parsed = jd.get(
        "parsed",
        {},
    )


    return {

        "application_id":
            application_id,

        "match_score":
            (
                application_doc.get("match_score")
                if application_doc
                else analysis.get("match_score")
            ),

        "skill_score":
            analysis.get("skill_score"),

        "semantic_score":
            analysis.get("semantic_score"),

        "matched_skills":
            analysis.get("matched_skills", []),

        "skill_gaps":
            (
                application_doc.get("skill_gaps", [])
                if application_doc
                else analysis.get("missing_skills", [])
            ),

        "required_skills":
            parsed.get("required_skills", []),

        "nice_to_have":
            parsed.get("nice_to_have_skills", []),

        "nice_to_have_matched":
            analysis.get("nice_to_have_matched", []),

        "experience_years":
            parsed.get("experience_years"),

        "recommendation":
            analysis.get("recommendation"),
    }


# ============================================================
# DASHBOARD SKILLS
# ============================================================

@app.get("/dashboard/skills")
async def skill_dashboard(
    x_user_id: str = Header(...),
):

    cursor = db.job_descriptions.find(
        {
            "user_id":
                x_user_id,
        }
    )


    all_required = []
    all_nice = []
    all_missing = []

    total_jds_analyzed = 0


    async for jd in cursor:

        total_jds_analyzed += 1


        parsed = jd.get(
            "parsed",
            {},
        )


        analysis = jd.get(
            "analysis",
            {},
        )


        all_required.extend(
            parsed.get(
                "required_skills",
                [],
            )
        )


        all_nice.extend(
            parsed.get(
                "nice_to_have_skills",
                [],
            )
        )


        # Prefer the analysis stored in the JD document.

        missing_skills = analysis.get(
            "missing_skills",
            [],
        )


        # Backward compatibility for older documents.

        if not missing_skills:

            application_id = jd.get(
                "application_id"
            )


            if application_id:

                try:

                    application_object_id = ObjectId(
                        application_id
                    )


                    application_doc = await db.applications.find_one(
                        {
                            "_id":
                                application_object_id,

                            "user_id":
                                x_user_id,
                        }
                    )


                    if application_doc:

                        missing_skills = application_doc.get(
                            "skill_gaps",
                            [],
                        )


                except (InvalidId, TypeError):

                    pass


        all_missing.extend(
            missing_skills
        )


    return {

        "most_demanded":
            Counter(
                all_required
            ).most_common(15),

        "most_missing":
            Counter(
                all_missing
            ).most_common(10),

        "nice_to_have_common":
            Counter(
                all_nice
            ).most_common(10),

        "total_jds_analyzed":
            total_jds_analyzed,
    }


# ============================================================
# HEALTH
# ============================================================

@app.get("/health")
async def health():

    return {
        "status": "ok",
        "service": "job_matcher",
        "version": "1.1.0",
    }