import os, io, re, uuid
from datetime import datetime
from typing import Optional, List

from fastapi import FastAPI, UploadFile, File, HTTPException, Header, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from minio import Minio
import pdfplumber
import spacy
from docx import Document

MONGO_URL        = os.getenv("MONGO_URL", "mongodb://localhost:27017")
MINIO_URL        = os.getenv("MINIO_URL", "localhost:9000")
MINIO_ACCESS_KEY = os.getenv("MINIO_ACCESS_KEY", "minioadmin")
MINIO_SECRET_KEY = os.getenv("MINIO_SECRET_KEY", "minioadmin")
MINIO_BUCKET     = os.getenv("MINIO_BUCKET", "resumes")

SKILLS_DICT = {
    "python","javascript","typescript","java","go","rust","c++","c#","ruby","php","swift","kotlin","scala",
    "react","vue","angular","next.js","nuxt","svelte","fastapi","django","flask","spring","express","node.js",
    "react query","redux","tailwind","bootstrap","graphql","rest","grpc",
    "sql","postgresql","mysql","mongodb","redis","elasticsearch","pandas","numpy","scikit-learn","tensorflow",
    "pytorch","keras","spark","kafka","airflow","dbt","powerbi","tableau",
    "docker","kubernetes","terraform","ansible","aws","gcp","azure","ci/cd","github actions","jenkins",
    "linux","bash","nginx","prometheus","grafana","git","microservices","tdd","system design","api design","nosql",
}

app = FastAPI(title="Resume Parser", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

mongo_client = AsyncIOMotorClient(MONGO_URL)
db = mongo_client["jat"]

minio_client = Minio(MINIO_URL, access_key=MINIO_ACCESS_KEY, secret_key=MINIO_SECRET_KEY, secure=False)

def ensure_bucket():
    if not minio_client.bucket_exists(MINIO_BUCKET):
        minio_client.make_bucket(MINIO_BUCKET)

try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    from spacy.cli import download
    download("en_core_web_sm")
    nlp = spacy.load("en_core_web_sm")


def extract_text_from_pdf(file_bytes: bytes) -> str:
    text = ""
    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        for page in pdf.pages:
            text += (page.extract_text() or "") + "\n"
    return text

def extract_text_from_docx(file_bytes: bytes) -> str:
    doc = Document(io.BytesIO(file_bytes))
    return "\n".join(p.text for p in doc.paragraphs)

def extract_skills(text: str) -> List[str]:
    lower = text.lower()
    found = set()
    for skill in SKILLS_DICT:
        if re.search(r'\b' + re.escape(skill) + r'\b', lower):
            found.add(skill)
    return sorted(found)

def extract_email(text: str) -> Optional[str]:
    m = re.search(r'[\w.+-]+@[\w-]+\.[a-zA-Z]{2,}', text)
    return m.group(0) if m else None

def extract_phone(text: str) -> Optional[str]:
    m = re.search(r'[\+]?[\d\s\-().]{7,15}', text)
    return m.group(0).strip() if m else None

def extract_name(text: str) -> Optional[str]:
    for line in text.split('\n'):
        line = line.strip()
        if line and len(line.split()) >= 2:
            return line[:60]
    return None

def extract_experience(text: str) -> List[dict]:
    experiences = []
    for match in re.finditer(r'(.+?)\s+at\s+(.+?)\s*[\|\-–]\s*(\d{4})', text, re.IGNORECASE):
        g = match.groups()
        experiences.append({"title": g[0].strip()[:100], "company": g[1].strip()[:100], "start_year": None, "end_year": None, "description": ""})
    for match in re.finditer(r'(.+?),?\s+(.+?)\s+(\d{4})\s*[-–]\s*(\d{4}|present|current)', text, re.IGNORECASE):
        g = match.groups()
        experiences.append({"title": g[0].strip()[:100], "company": g[1].strip()[:100], "start_year": None, "end_year": None, "description": ""})
    return experiences[:8]

def extract_education(text: str) -> List[dict]:
    degrees = []
    kws = ['bachelor','master','phd','b.sc','m.sc','b.tech','m.tech','mba','b.e','m.e']
    for line in text.split('\n'):
        if any(k in line.lower() for k in kws):
            yr = re.search(r'\b(19|20)\d{2}\b', line)
            degrees.append({"degree": line.strip()[:150], "institution": "", "year": int(yr.group(0)) if yr else None})
    return degrees[:4]

def parse_resume(text: str) -> dict:
    return {
        "skills":     extract_skills(text),
        "experience": extract_experience(text),
        "education":  extract_education(text),
        "name":       extract_name(text),
        "email":      extract_email(text),
        "phone":      extract_phone(text),
    }


@app.post("/resume/upload")
async def upload_resume(file: UploadFile = File(...), x_user_id: str = Header(...)):
    ensure_bucket()
    file_bytes = await file.read()
    filename   = file.filename.lower()

    if filename.endswith(".pdf"):
        raw_text = extract_text_from_pdf(file_bytes)
    elif filename.endswith(".docx"):
        raw_text = extract_text_from_docx(file_bytes)
    else:
        raise HTTPException(status_code=400, detail="Only PDF and DOCX are supported")

    object_name = f"{x_user_id}/{uuid.uuid4()}/{file.filename}"
    minio_client.put_object(MINIO_BUCKET, object_name, io.BytesIO(file_bytes), len(file_bytes), content_type=file.content_type)
    file_url = f"http://{MINIO_URL}/{MINIO_BUCKET}/{object_name}"

    parsed = parse_resume(raw_text)
    doc = {
        "user_id": x_user_id, "file_url": file_url,
        "original_filename": file.filename, "raw_text": raw_text,
        "parsed": parsed, "created_at": datetime.utcnow(),
    }
    result = await db.resumes.insert_one(doc)
    return {"id": str(result.inserted_id), "user_id": x_user_id, "file_url": file_url,
            "original_filename": file.filename, "parsed": parsed, "created_at": doc["created_at"].isoformat()}

@app.get("/resume/list")
async def list_resumes(x_user_id: str = Header(...)):
    cursor = db.resumes.find({"user_id": x_user_id}).sort("created_at", -1)
    resumes = []
    async for doc in cursor:
        doc["id"] = str(doc.pop("_id"))
        doc["created_at"] = doc["created_at"].isoformat()
        doc.pop("raw_text", None)
        resumes.append(doc)
    return resumes

@app.get("/resume/{resume_id}")
async def get_resume(resume_id: str, x_user_id: str = Header(...)):
    doc = await db.resumes.find_one({"_id": ObjectId(resume_id), "user_id": x_user_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Resume not found")
    doc["id"] = str(doc.pop("_id"))
    doc["created_at"] = doc["created_at"].isoformat()
    doc.pop("raw_text", None)
    return doc

# @app.delete("/resume/{resume_id}")
# async def delete_resume(resume_id: str, x_user_id: str = Header(...)):
#     result = await db.resumes.delete_one({"_id": ObjectId(resume_id), "user_id": x_user_id})
#     if result.deleted_count == 0:
#         raise HTTPException(status_code=404, detail="Resume not found")
#     return {"deleted": True, "id": resume_id}


@app.delete("/resume/{resume_id}")
async def delete_resume(resume_id: str, request: Request):
    user_id = request.headers.get("X-User-ID")

    result = await db.resumes.delete_one({
        "_id": ObjectId(resume_id),
        "user_id": user_id   
    })

    if result.deleted_count == 0:
        return {"message": "Not found or not authorized"}

    return {"message": "Deleted successfully"}


@app.get("/health")
async def health():
    return {"status": "ok", "service": "resume_parser"}
