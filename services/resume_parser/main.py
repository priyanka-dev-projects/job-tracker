import os, io, re, uuid
from datetime import datetime
from typing import Optional, List

from fastapi import FastAPI, UploadFile, File, HTTPException, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import pdfplumber
import spacy
from docx import Document

from jose import jwt, JWTError
from fastapi.security import OAuth2PasswordBearer
from fastapi import Depends

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

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

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

mongo_client = AsyncIOMotorClient(MONGO_URL)
db = mongo_client["jat"]

SECRET_KEY = os.getenv("JWT_SECRET", "secret")
ALGORITHM = "HS256"

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

async def get_current_user_id(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        user_id = payload.get("sub")

        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")

        return user_id

    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

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


def parse_resume(text: str) -> dict:
    return {
        "skills": extract_skills(text),
        "name": extract_name(text),
        "email": extract_email(text),
        "phone": extract_phone(text),
    }


# @app.post("/resume/upload")
# async def upload_resume(
#     file: UploadFile = File(...),
#     x_user_id: str = Header(...)
# ):

@app.post("/resume/upload")
async def upload_resume(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user_id)
):
    file_bytes = await file.read()

    filename = file.filename.lower()

    if filename.endswith(".pdf"):
        raw_text = extract_text_from_pdf(file_bytes)

    elif filename.endswith(".docx"):
        raw_text = extract_text_from_docx(file_bytes)

    else:
        raise HTTPException(
            status_code=400,
            detail="Only PDF and DOCX supported"
        )

    unique_name = f"{uuid.uuid4()}_{file.filename}"

    file_path = os.path.join(UPLOAD_DIR, unique_name)

    with open(file_path, "wb") as f:
        f.write(file_bytes)

    parsed = parse_resume(raw_text)

    doc = {
        # "user_id": x_user_id,
        "user_id": user_id,
        "file_url": file_path,
        "original_filename": file.filename,
        "raw_text": raw_text,
        "parsed": parsed,
        "created_at": datetime.utcnow(),
    }

    result = await db.resumes.insert_one(doc)

    return {
        "id": str(result.inserted_id),
        # "user_id": x_user_id,
        "user_id": user_id,
        "file_url": file_path,
        "original_filename": file.filename,
        "parsed": parsed,
        "created_at": doc["created_at"].isoformat(),
    }


@app.get("/resume/list")
# async def list_resumes(x_user_id: str = Header(...)):
async def list_resumes(user_id: str = Depends(get_current_user_id)):
    cursor = db.resumes.find(
        # {"user_id": x_user_id}
        {"user_id": user_id}
    ).sort("created_at", -1)

    resumes = []

    async for doc in cursor:
        doc["id"] = str(doc.pop("_id"))
        doc["created_at"] = doc["created_at"].isoformat()
        doc.pop("raw_text", None)

        resumes.append(doc)

    return resumes


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "service": "resume_parser"
    }