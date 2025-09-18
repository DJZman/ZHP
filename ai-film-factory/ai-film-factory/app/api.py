from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from app.db import get_session
from app.services.franchise_project import create_project_from_franchise, promote_character_to_canon
from app.services.franchise_crud import (
    list_franchises, get_franchise, create_franchise, update_franchise, delete_franchise,
    list_franchise_characters, create_franchise_character, update_character, delete_character
)
from app.services.seeds import seed_dev
from app.schemas import FranchiseCreate, FranchiseUpdate, CharacterCreate, CharacterUpdate, NewProjectReq

app = FastAPI(title="AI Film Factory API")

# CORS for local dev UIs (Vite: 5173, Next: 3000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---- Projects from Franchise ----
@app.post("/projects/from-franchise")
def api_create_project(req: NewProjectReq):
    with get_session() as db:
        try:
            proj = create_project_from_franchise(
                db=db,
                franchise_id=req.franchise_id,
                title=req.title,
                premise=req.premise,
                target_duration_s=req.target_duration_s,
                style=req.style,
                genre=req.genre
            )
            return {
                "project_id": proj.ProjectID,
                "franchise_id": proj.FranchiseID,
                "franchise_version": proj.FranchiseVersion,
                "state": proj.State
            }
        except Exception as ex:
            raise HTTPException(status_code=400, detail=str(ex))

# ---- Franchise CRUD ----
@app.get("/franchises")
def api_list_franchises():
    with get_session() as db:
        rows = list_franchises(db)
        return [{"franchise_id": r.FranchiseID, "title": r.Title, "version": r.Version} for r in rows]

@app.post("/franchises")
def api_create_franchise(req: FranchiseCreate):
    with get_session() as db:
        fran = create_franchise(db, req.title, req.description, req.bible_json)
        return {"franchise_id": fran.FranchiseID}

@app.get("/franchises/{fid}")
def api_get_franchise(fid: int):
    with get_session() as db:
        fran = get_franchise(db, fid)
        return {
            "franchise_id": fran.FranchiseID,
            "title": fran.Title,
            "description": fran.Description,
            "version": fran.Version,
            "bible_json": fran.BibleJson
        }

@app.put("/franchises/{fid}")
def api_update_franchise(fid: int, req: FranchiseUpdate):
    with get_session() as db:
        fran = update_franchise(db, fid, **req.dict())
        return {"franchise_id": fran.FranchiseID, "version": fran.Version}

@app.delete("/franchises/{fid}")
def api_delete_franchise(fid: int):
    with get_session() as db:
        delete_franchise(db, fid)
        return {"status": "deleted"}

# ---- Franchise Characters ----
@app.get("/franchises/{fid}/characters")
def api_list_characters(fid: int):
    with get_session() as db:
        chars = list_franchise_characters(db, fid)
        return [
            {
                "character_id": c.CharacterID,
                "name": c.Name,
                "canonical_key": c.CanonicalKey,
                "state": c.State
            } for c in chars
        ]

@app.post("/franchises/{fid}/characters")
def api_create_character(fid: int, req: CharacterCreate):
    with get_session() as db:
        ch = create_franchise_character(
            db, fid, req.name, req.description, req.card_image_url, req.prompt_json, req.canonical_key, req.state
        )
        return {"character_id": ch.CharacterID}

@app.put("/characters/{cid}")
def api_update_character(cid: int, req: CharacterUpdate):
    with get_session() as db:
        ch = update_character(db, cid, **req.dict())
        return {"character_id": ch.CharacterID}

@app.delete("/characters/{cid}")
def api_delete_character(cid: int):
    with get_session() as db:
        delete_character(db, cid)
        return {"status": "deleted"}

# ---- Promote character to canon ----
class PromoteReq(BaseModel):
    project_character_id: int

@app.post("/franchise/promote-character")
def api_promote_character(req: PromoteReq):
    with get_session() as db:
        try:
            promote_character_to_canon(db, req.project_character_id)
            return {"status": "ok"}
        except Exception as ex:
            raise HTTPException(status_code=400, detail=str(ex))

# ---- Dev seed ----
@app.post("/seed/dev")
def api_seed_dev():
    with get_session() as db:
        result = seed_dev(db)
        return result
