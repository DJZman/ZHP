from pydantic import BaseModel
from typing import Optional

class FranchiseCreate(BaseModel):
    title: str
    description: str | None = None
    bible_json: str | None = None

class FranchiseUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    bible_json: str | None = None
    version: int | None = None

class CharacterCreate(BaseModel):
    name: str
    description: str | None = None
    card_image_url: str | None = None
    prompt_json: str | None = None
    canonical_key: str | None = None
    state: str | None = "Approved"

class CharacterUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    card_image_url: str | None = None
    prompt_json: str | None = None
    canonical_key: str | None = None
    state: str | None = None

class NewProjectReq(BaseModel):
    franchise_id: int
    title: str
    premise: str
    target_duration_s: int
    style: str | None = None
    genre: str | None = None
