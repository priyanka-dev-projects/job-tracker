import os
from datetime import datetime, timezone
from typing import Optional, List

from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from pydantic import BaseModel
# import asyncio

MONGO_URL = os.getenv("MONGO_URL", "mongodb+srv://jat_db_user:Pk%407975463006@cluster0.6hy7bvy.mongodb.net/?appName=Cluster0")

app = FastAPI(title="Application Manager", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

mongo_client = AsyncIOMotorClient(MONGO_URL)
db = mongo_client["jat"]

VALID_STATUSES = {"wishlist","applied","screening","interview","offer","rejected"}


class ApplicationCreate(BaseModel):
    company:   str
    role:      str
    job_url:   Optional[str] = None
    resume_id: Optional[str] = None
    notes:     Optional[str] = None
    status:    Optional[str] = "wishlist"

class ApplicationUpdate(BaseModel):
    company:   Optional[str] = None
    role:      Optional[str] = None
    job_url:   Optional[str] = None
    resume_id: Optional[str] = None
    notes:     Optional[str] = None

class StatusUpdate(BaseModel):
    status: str
    note:   Optional[str] = None


# def serialize(doc: dict) -> dict:
#     doc["id"] = str(doc.pop("_id"))
#     for k in ("created_at", "updated_at"):
#         if isinstance(doc.get(k), datetime):
#             doc[k] = doc[k].isoformat()
#     for e in doc.get("timeline", []):
#         if isinstance(e.get("timestamp"), datetime):
#             e["timestamp"] = e["timestamp"].isoformat()
#     return doc

def serialize(doc: dict) -> dict:
    doc["id"] = str(doc.pop("_id"))

    for key in ("created_at", "updated_at"):
        value = doc.get(key)

        if isinstance(value, datetime):

            # MongoDB returns UTC datetime without tzinfo.
            # Explicitly mark it as UTC before sending to frontend.
            if value.tzinfo is None:
                value = value.replace(tzinfo=timezone.utc)

            doc[key] = value.isoformat()

    for entry in doc.get("timeline", []):
        timestamp = entry.get("timestamp")

        if isinstance(timestamp, datetime):

            # Explicitly mark MongoDB datetime as UTC.
            if timestamp.tzinfo is None:
                timestamp = timestamp.replace(
                    tzinfo=timezone.utc
                )

            entry["timestamp"] = timestamp.isoformat()

    return doc

@app.post("/applications")
async def create_application(body: ApplicationCreate, x_user_id: str = Header(...)):
    # now    = datetime.utcnow()
    now = datetime.now(timezone.utc)
    status = body.status if body.status in VALID_STATUSES else "wishlist"
    doc    = {
        "user_id": x_user_id, "company": body.company, "role": body.role,
        "job_url": body.job_url, "resume_id": body.resume_id, "notes": body.notes,
        "status": status, "match_score": None, "skill_gaps": [],
        "timeline": [{"status": status, "timestamp": now, "note": "Application created"}],
        "created_at": now, "updated_at": now,
    }
    result = await db.applications.insert_one(doc)
    doc["_id"] = result.inserted_id
    return serialize(doc)

@app.get("/applications/stats/overview")
async def stats(x_user_id: str = Header(...)):
    # await asyncio.sleep(1)
    cursor = db.applications.aggregate([
        {"$match": {"user_id": x_user_id}},
        {"$group": {"_id": "$status", "count": {"$sum": 1}}},
    ])
    counts = {}
    async for row in cursor:
        counts[row["_id"]] = row["count"]
    avg_cursor = db.applications.aggregate([
        {"$match": {"user_id": x_user_id, "match_score": {"$ne": None}}},
        {"$group": {"_id": None, "avg": {"$avg": "$match_score"}}},
    ])
    avg_score = None
    async for row in avg_cursor:
        avg_score = round(row["avg"], 1)
    return {"total": sum(counts.values()), "by_status": counts, "avg_match_score": avg_score}

# @app.get("/applications")
# async def list_applications(x_user_id: str = Header(...)):
#     cursor = db.applications.find({"user_id": x_user_id}).sort("updated_at", -1)
#     return [serialize(doc) async for doc in cursor]

@app.get("/applications")
async def list_applications(
    x_user_id: str = Header(...),
    status: Optional[str] = None,
    search: Optional[str] = None,
):
    query = {
        "user_id": x_user_id
    }

    # Filter by status
    if status and status != "all":
        query["status"] = status

    # Search by company name
    if search:
        query["company"] = {
            "$regex": search,
            "$options": "i"
        }

    cursor = db.applications.find(query).sort("updated_at", -1)

    return [serialize(doc) async for doc in cursor]

@app.get("/applications/{app_id}")
async def get_application(app_id: str, x_user_id: str = Header(...)):
    doc = await db.applications.find_one({"_id": ObjectId(app_id), "user_id": x_user_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Application not found")
    return serialize(doc)

# @app.patch("/applications/{app_id}/status")
# async def update_status(app_id: str, body: StatusUpdate, x_user_id: str = Header(...)):
    if body.status not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail=f"Invalid status")
    now = datetime.utcnow()
    result = await db.applications.update_one(
        {"_id": ObjectId(app_id), "user_id": x_user_id},
        {"$set": {"status": body.status, "updated_at": now},
         "$push": {"timeline": {"status": body.status, "timestamp": now, "note": body.note}}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Application not found")
    doc = await db.applications.find_one({"_id": ObjectId(app_id)})
    return serialize(doc)

@app.patch("/applications/{app_id}/status")
async def update_status(
    app_id: str,
    body: StatusUpdate,
    x_user_id: str = Header(...),
):
    if not ObjectId.is_valid(app_id):
        raise HTTPException(
            status_code=400,
            detail="Invalid application ID",
        )

    if body.status not in VALID_STATUSES:
        raise HTTPException(
            status_code=400,
            detail="Invalid status",
        )

    now = datetime.now(timezone.utc)

    result = await db.applications.update_one(
        {
            "_id": ObjectId(app_id),
            "user_id": x_user_id,
        },
        {
            "$set": {
                "status": body.status,
                "updated_at": now,
            },
            "$push": {
                "timeline": {
                    "status": body.status,
                    "timestamp": now,
                    "note": body.note,
                }
            },
        },
    )

    if result.matched_count == 0:
        raise HTTPException(
            status_code=404,
            detail="Application not found",
        )

    updated_application = await db.applications.find_one(
        {
            "_id": ObjectId(app_id),
            "user_id": x_user_id,
        }
    )

    return serialize(updated_application)

@app.patch("/applications/{app_id}")
async def update_application(app_id: str, body: ApplicationUpdate, x_user_id: str = Header(...)):
    update = {k: v for k, v in body.model_dump().items() if v is not None}
    if not update:
        raise HTTPException(status_code=400, detail="Nothing to update")
    # update["updated_at"] = datetime.utcnow()
    update["updated_at"] = datetime.now(timezone.utc)
    result = await db.applications.update_one(
        {"_id": ObjectId(app_id), "user_id": x_user_id}, {"$set": update}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Application not found")
    doc = await db.applications.find_one({"_id": ObjectId(app_id)})
    return serialize(doc)

@app.delete("/applications/{app_id}")
async def delete_application(app_id: str, x_user_id: str = Header(...)):
    result = await db.applications.delete_one({"_id": ObjectId(app_id), "user_id": x_user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Application not found")
    await db.job_descriptions.delete_many({"application_id": app_id})
    return {"deleted": True, "id": app_id}

@app.get("/health")
async def health():
    return {"status": "ok", "service": "app_manager"}
