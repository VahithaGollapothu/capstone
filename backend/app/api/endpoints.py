import uuid
from datetime import datetime
from fastapi import APIRouter, HTTPException
from app.models import schemas
from app.core import groq_client, db

router = APIRouter()

@router.post("/floorplan/generate")
async def generate_floorplan(payload: schemas.FloorPlanRequest):
    try:
        layout = await groq_client.generate_floor_plan(
            dimensions=payload.dimensions,
            rooms_per_floor=payload.rooms,
            floors=payload.floors,
            style=payload.style,
            budget=payload.budget,
            include_penthouse=payload.include_penthouse,
        )
        return {"status": "success", "data": layout}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/elevation/generate")
async def generate_elevation(payload: schemas.ElevationRequest):
    try:
        elevation = await groq_client.generate_elevation(style=payload.style, floors=payload.floors)
        return {"status": "success", "data": elevation}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/colors/generate")
async def generate_colors(payload: schemas.ColorPaletteRequest):
    try:
        colors = await groq_client.generate_colors(
            theme=payload.theme,
            room_type=payload.room_type,
            lighting=payload.lighting,
        )
        return {"status": "success", "data": colors}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/exterior/generate")
async def generate_exterior(payload: schemas.ExteriorRequest):
    try:
        exterior = await groq_client.generate_exterior(style=payload.style)
        return {"status": "success", "data": exterior}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/chat/ask")
async def chat_architect(payload: schemas.ChatRequest):
    try:
        response = await groq_client.ask_architect(
            question=payload.message,
            history=payload.history,
        )
        return {"status": "success", "response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/projects/save")
async def save_project(project: schemas.ProjectSaveRequest):
    new_project = {
        "id": str(uuid.uuid4()),
        "title": project.title,
        "type": project.type,
        "data": project.data,
        "previewUrl": project.previewUrl,
        "createdAt": datetime.utcnow().isoformat(),
    }
    if db.db is not None:
        try:
            await db.db.projects.insert_one(new_project.copy())
        except Exception:
            db.in_memory_db["projects"].append(new_project)
    else:
        db.in_memory_db["projects"].append(new_project)
    return {"status": "success", "message": "Project saved successfully", "project": new_project}

@router.get("/projects/list")
async def list_projects():
    if db.db is not None:
        try:
            cursor = db.db.projects.find({}, {"_id": 0})
            projects = await cursor.to_list(length=100)
            return {"status": "success", "projects": projects}
        except Exception:
            return {"status": "success", "projects": db.in_memory_db["projects"]}
    return {"status": "success", "projects": db.in_memory_db["projects"]}

@router.delete("/projects/delete/{project_id}")
async def delete_project(project_id: str):
    deleted = False
    if db.db is not None:
        try:
            res = await db.db.projects.delete_one({"id": project_id})
            if res.deleted_count > 0:
                deleted = True
        except Exception:
            pass
    if not deleted:
        original_len = len(db.in_memory_db["projects"])
        db.in_memory_db["projects"] = [p for p in db.in_memory_db["projects"] if p["id"] != project_id]
        if len(db.in_memory_db["projects"]) < original_len:
            deleted = True
    if not deleted:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"status": "success", "message": "Project deleted successfully"}
