from sqlalchemy.orm import Session
from typing import List, Optional
from app.models import Franchise, Character

def list_franchises(db: Session) -> List[Franchise]:
    return db.query(Franchise).order_by(Franchise.FranchiseID.desc()).all()

def get_franchise(db: Session, franchise_id: int) -> Franchise:
    return db.query(Franchise).filter(Franchise.FranchiseID == franchise_id).one()

def create_franchise(db: Session, title: str, description: str | None, bible_json: str | None) -> Franchise:
    fran = Franchise(Title=title, Description=description, BibleJson=bible_json, Version=1)
    db.add(fran)
    db.commit()
    db.refresh(fran)
    return fran

def update_franchise(db: Session, franchise_id: int, **kwargs) -> Franchise:
    fran = get_franchise(db, franchise_id)
    if "title" in kwargs and kwargs["title"] is not None:
        fran.Title = kwargs["title"]
    if "description" in kwargs and kwargs["description"] is not None:
        fran.Description = kwargs["description"]
    if "bible_json" in kwargs and kwargs["bible_json"] is not None:
        fran.BibleJson = kwargs["bible_json"]
    if "version" in kwargs and kwargs["version"] is not None:
        fran.Version = kwargs["version"]
    db.commit()
    db.refresh(fran)
    return fran

def delete_franchise(db: Session, franchise_id: int) -> None:
    fran = get_franchise(db, franchise_id)
    db.delete(fran)
    db.commit()

def list_franchise_characters(db: Session, franchise_id: int) -> List[Character]:
    return (
        db.query(Character)
        .filter(Character.FranchiseID == franchise_id, Character.ProjectID == None)
        .order_by(Character.CharacterID.desc())
        .all()
    )

def create_franchise_character(
    db: Session,
    franchise_id: int,
    name: str,
    description: str | None,
    card_image_url: str | None,
    prompt_json: str | None,
    canonical_key: str | None,
    state: str | None,
) -> Character:
    ch = Character(
        ProjectID=None,
        FranchiseID=franchise_id,
        CanonicalKey=canonical_key,
        Name=name,
        Description=description,
        CardImageUrl=card_image_url,
        PromptJson=prompt_json,
        State=state or "Approved",
    )
    db.add(ch)
    db.commit()
    db.refresh(ch)
    return ch

def update_character(db: Session, character_id: int, **kwargs) -> Character:
    ch = db.query(Character).filter(Character.CharacterID == character_id).one()
    for k in ["Name","Description","CardImageUrl","PromptJson","CanonicalKey","State"]:
        lk = k[0].lower() + k[1:]
        if lk in kwargs and kwargs[lk] is not None:
            setattr(ch, k, kwargs[lk])
    db.commit()
    db.refresh(ch)
    return ch

def delete_character(db: Session, character_id: int) -> None:
    ch = db.query(Character).filter(Character.CharacterID == character_id).one()
    db.delete(ch)
    db.commit()
