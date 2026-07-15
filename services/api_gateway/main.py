import os
import httpx
from datetime import datetime, timedelta
from typing import Optional
from fastapi.responses import JSONResponse
from fastapi import Query

# from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Request
from fastapi import (
    FastAPI,
    Depends,
    HTTPException,
    status,
    UploadFile,
    File,
    Request,
    Response,
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr
from bson import ObjectId

SECRET_KEY       = os.getenv("SECRET_KEY", "dev-secret-key-change-in-production")
ALGORITHM        = "HS256"
TOKEN_EXPIRE_MIN = int(os.getenv("TOKEN_EXPIRE_MINUTES", "1440"))

# MONGO_URL          = os.getenv("MONGO_URL", "mongodb://localhost:27017")
MONGO_URL          = os.getenv("MONGO_URL", "mongodb+srv://jat_db_user:Pk%407975463006@cluster0.6hy7bvy.mongodb.net/?appName=Cluster0")
# RESUME_PARSER_URL  = os.getenv("RESUME_PARSER_URL", "http://localhost:8001")
RESUME_PARSER_URL  = os.getenv("RESUME_PARSER_URL", "https://resume-praser-dnlp.onrender.com")
# JOB_MATCHER_URL    = os.getenv("JOB_MATCHER_URL",   "http://localhost:8002")
JOB_MATCHER_URL    = os.getenv("JOB_MATCHER_URL",   "https://jat-job-matcher.onrender.com")
# APP_MANAGER_URL    = os.getenv("APP_MANAGER_URL",    "http://localhost:8003")
APP_MANAGER_URL    = os.getenv("APP_MANAGER_URL",    "https://app-manager-4efl.onrender.com")


app = FastAPI(title="JAT API Gateway", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

mongo_client = AsyncIOMotorClient(MONGO_URL)
db = mongo_client["jat"]

pwd_context   = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def hash_password(p: str) -> str:
    return pwd_context.hash(p)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=TOKEN_EXPIRE_MIN))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(token: str = Depends(oauth2_scheme)):
    exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if not user_id:
            raise exc
    except JWTError:
        raise exc
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise exc
    return user

class ApplicationCreateRequest(BaseModel):
    company: str
    role: str
    job_url: Optional[str] = None
    notes: Optional[str] = None

class MatchRequest(BaseModel):
    resume_id: str
    application_id: str
    jd_text: str

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    name: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user_id: str
    name: str
    email: str


@app.post("/auth/register", response_model=TokenResponse)
async def register(body: RegisterRequest):
    if await db.users.find_one({"email": body.email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    doc = {
        "email": body.email,
        "name": body.name,
        "password_hash": hash_password(body.password),
        "created_at": datetime.utcnow(),
    }
    result  = await db.users.insert_one(doc)
    user_id = str(result.inserted_id)
    token   = create_access_token({"sub": user_id})
    return TokenResponse(access_token=token, token_type="bearer", user_id=user_id, name=body.name, email=body.email)


@app.post("/auth/login", response_model=TokenResponse)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = await db.users.find_one({"email": form_data.username})
    if not user or not verify_password(form_data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    token = create_access_token({"sub": str(user["_id"])})
    return TokenResponse(access_token=token, token_type="bearer", user_id=str(user["_id"]), name=user["name"], email=user["email"])


@app.get("/auth/me")
async def me(current_user=Depends(get_current_user)):
    return {"id": str(current_user["_id"]), "email": current_user["email"], "name": current_user["name"]}


# async def proxy(method: str, url: str, current_user, **kwargs):
#     headers = kwargs.pop("headers", {})
#     headers["X-User-ID"] = str(current_user["_id"])
#     async with httpx.AsyncClient(timeout=30) as client:
#         resp = await client.request(method, url, headers=headers, **kwargs)
#     return resp.json(), resp.status_code


async def proxy(method: str, url: str, current_user, **kwargs):
    headers = kwargs.pop("headers", {})
    headers["X-User-ID"] = str(current_user["_id"])

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.request(
            method,
            url,
            headers=headers,
            **kwargs,
        )

    try:
        data = resp.json()
    except Exception:
        data = {
            "detail": resp.text
        }

    return data, resp.status_code


# @app.delete("/resumes/{resume_id}")
# async def delete_resume(resume_id: str, request: Request):
#     user_id = request.headers.get("X-User-ID")

#     await db.resumes.delete_one({
#         "_id": ObjectId(resume_id),
#         "user_id": str(current_user["_id"])
#     })

#     return {"message": "Deleted"}

# @app.delete("/resumes/{resume_id}")
# async def delete_resume(resume_id: str, current_user=Depends(get_current_user)):
#     data, _ = await proxy(
#         "DELETE",
#         f"{RESUME_PARSER_URL}/resumes/{resume_id}",
#         current_user
#     )
#     return data


@app.delete("/resumes/{resume_id}")
async def delete_resume(
    resume_id: str,
    current_user=Depends(get_current_user),
):
    data, status_code = await proxy(
        "DELETE",
        f"{RESUME_PARSER_URL}/resumes/{resume_id}",
        current_user,
    )

    return JSONResponse(
        content=data,
        status_code=status_code,
    )

# @app.post("/resumes/upload")
# async def upload_resume(file: UploadFile = File(...), current_user=Depends(get_current_user)):
#     user_id = str(current_user["_id"])
#     async with httpx.AsyncClient(timeout=60) as client:
#         files = {"file": (file.filename, await file.read(), file.content_type)}
#         # resp  = await client.post(f"{RESUME_PARSER_URL}/resume/upload", files=files, headers={"X-User-ID": user_id})
#         resp  = await client.post(f"{RESUME_PARSER_URL}/resumes/upload", files=files, headers={"X-User-ID": user_id})
#     return resp.json()


@app.post("/resumes/upload")
async def upload_resume(
    file: UploadFile = File(...),
    current_user=Depends(get_current_user),
):
    user_id = str(current_user["_id"])

    async with httpx.AsyncClient(timeout=60) as client:
        files = {
            "file": (
                file.filename,
                await file.read(),
                file.content_type,
            )
        }

        print("RESUME_PARSER_URL =", RESUME_PARSER_URL)
        print("Uploading to:", f"{RESUME_PARSER_URL}/resumes/upload")
        

        resp = await client.post(
            f"{RESUME_PARSER_URL}/resumes/upload",
            files=files,
            headers={
                "X-User-ID": user_id,
            },
        )

    print("STATUS:", resp.status_code)
    print("CONTENT-TYPE:", resp.headers.get("content-type"))
    print("BODY:", resp.text)

    try:
        data = resp.json()
    except Exception:
        data = {
            "detail": resp.text
        }

    return JSONResponse(
        content=data,
        status_code=resp.status_code,
    )

@app.get("/resumes")
async def list_resumes(current_user=Depends(get_current_user)):
    # data, _ = await proxy("GET", f"{RESUME_PARSER_URL}/resume/list", current_user)
    data, _ = await proxy("GET", f"{RESUME_PARSER_URL}/resumes", current_user)
    return data

@app.get("/resumes/{resume_id}/preview")
async def preview_resume(
    resume_id: str,
    current_user=Depends(get_current_user),
):
    user_id = str(current_user["_id"])

    async with httpx.AsyncClient(timeout=60) as client:

        resp = await client.get(
            f"{RESUME_PARSER_URL}/resumes/{resume_id}/preview",
            headers={
                "X-User-ID": user_id,
            },
        )

    if resp.status_code != 200:
        try:
            error_data = resp.json()

            detail = error_data.get(
                "detail",
                "Preview failed",
            )

        except Exception:
            detail = "Preview failed"

        raise HTTPException(
            status_code=resp.status_code,
            detail=detail,
        )

    return Response(
        content=resp.content,
        status_code=resp.status_code,
        media_type=resp.headers.get(
            "content-type",
            "application/octet-stream",
        ),
        headers={
            "Content-Disposition":
                resp.headers.get(
                    "content-disposition",
                    "inline",
                ),
        },
    )


@app.get("/resumes/{resume_id}/download")
async def download_resume(
    resume_id: str,
    current_user=Depends(get_current_user),
):
    user_id = str(current_user["_id"])

    async with httpx.AsyncClient(timeout=60) as client:

        resp = await client.get(
            f"{RESUME_PARSER_URL}/resumes/{resume_id}/download",
            headers={
                "X-User-ID": user_id,
            },
        )

    if resp.status_code != 200:
        try:
            error_data = resp.json()

            detail = error_data.get(
                "detail",
                "Download failed",
            )

        except Exception:
            detail = "Download failed"

        raise HTTPException(
            status_code=resp.status_code,
            detail=detail,
        )

    return Response(
        content=resp.content,
        status_code=resp.status_code,
        media_type=resp.headers.get(
            "content-type",
            "application/octet-stream",
        ),
        headers={
            "Content-Disposition":
                resp.headers.get(
                    "content-disposition",
                    "attachment",
                ),
        },
    )

@app.get("/resumes/{resume_id}")
async def get_resume(resume_id: str, current_user=Depends(get_current_user)):
    data, _ = await proxy("GET", f"{RESUME_PARSER_URL}/resumes/{resume_id}", current_user)
    return data


# @app.get("/applications/stats/overview")
# async def stats(current_user=Depends(get_current_user)):
#     data, _ = await proxy("GET", f"{APP_MANAGER_URL}/applications/stats/overview", current_user)
#     return data

# # @app.get("/applications")
# # async def list_applications(current_user=Depends(get_current_user)):
#     data, _ = await proxy("GET", f"{APP_MANAGER_URL}/applications", current_user)
#     return data

@app.get("/applications/stats/overview")
async def stats(current_user=Depends(get_current_user)):
    data, status_code = await proxy(
        "GET",
        f"{APP_MANAGER_URL}/applications/stats/overview",
        current_user,
    )

    return JSONResponse(
        content=data,
        status_code=status_code,
    )


@app.get("/applications")
async def list_applications(
    current_user=Depends(get_current_user),
    status: str = Query("all"),
    search: str = Query(""),
):
    data, status_code = await proxy(
        "GET",
        f"{APP_MANAGER_URL}/applications",
        current_user,
        params={
            "status": status,
            "search": search,
        },
    )

    return JSONResponse(
        content=data,
        status_code=status_code,
    )


# @app.post("/applications")
# async def create_application(request: Request, current_user=Depends(get_current_user)):
#     body = await request.json()
#     data, _ = await proxy("POST", f"{APP_MANAGER_URL}/applications", current_user, json=body)
#     return data

@app.post("/applications")
async def create_application(
    body: ApplicationCreateRequest,
    current_user=Depends(get_current_user)
):
    data, _ = await proxy(
        "POST",
        f"{APP_MANAGER_URL}/applications",
        current_user,
        json=body.dict()
    )
    return data

@app.get("/applications/{app_id}")
async def get_application(app_id: str, current_user=Depends(get_current_user)):
    data, _ = await proxy("GET", f"{APP_MANAGER_URL}/applications/{app_id}", current_user)
    return data

@app.patch("/applications/{app_id}/status")
async def update_status(app_id: str, request: Request, current_user=Depends(get_current_user)):
    body = await request.json()
    data, _ = await proxy("PATCH", f"{APP_MANAGER_URL}/applications/{app_id}/status", current_user, json=body)
    return data

@app.patch("/applications/{app_id}")
async def update_application(app_id: str, request: Request, current_user=Depends(get_current_user)):
    body = await request.json()
    data, _ = await proxy("PATCH", f"{APP_MANAGER_URL}/applications/{app_id}", current_user, json=body)
    return data

@app.delete("/applications/{app_id}")
async def delete_application(app_id: str, current_user=Depends(get_current_user)):
    data, _ = await proxy("DELETE", f"{APP_MANAGER_URL}/applications/{app_id}", current_user)
    return data


@app.post("/match")
async def match_resume(
    body: MatchRequest,
    current_user=Depends(get_current_user)
):
    data, _ = await proxy(
        "POST",
        f"{JOB_MATCHER_URL}/match",
        current_user,
        json=body.dict()
    )
    return data

@app.get("/gaps/{application_id}")
async def skill_gaps(application_id: str, current_user=Depends(get_current_user)):
    data, _ = await proxy("GET", f"{JOB_MATCHER_URL}/gaps/{application_id}", current_user)
    return data

@app.get("/dashboard/skills")
async def skill_dashboard(current_user=Depends(get_current_user)):
    data, _ = await proxy("GET", f"{JOB_MATCHER_URL}/dashboard/skills", current_user)
    return data


@app.get("/health")
async def health():
    return {"status": "ok", "service": "api_gateway"}
