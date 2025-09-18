from typing import Optional, List
from sqlalchemy.orm import Session
from app.models import Franchise, Project, Character, Scene

def create_project_from_franchise(
    db: Session,
    franchise_id: int,
    title: str,
    premise: str,
    target_duration_s: int,
    style: Optional[str] = None,
    genre: Optional[str] = None,
) -> Project:
    fran = db.query(Franchise).filter(Franchise.FranchiseID == franchise_id).one()

    proj = Project(
        Title=title,
        Premise=premise,
        TargetDuration_s=target_duration_s,
        Style=style,
        Genre=genre,
        State="Draft",
        FranchiseID=franchise_id,
        FranchiseVersion=fran.Version,
        BibleJsonSnapshot=fran.BibleJson,
    )
    db.add(proj)
    db.flush()

    fran_chars: List[Character] = (
        db.query(Character)
        .filter(Character.FranchiseID == franchise_id, Character.ProjectID == None)
        .all()
    )
    for ch in fran_chars:
        clone = Character(
            ProjectID=proj.ProjectID,
            FranchiseID=franchise_id,
            CanonicalKey=ch.CanonicalKey or f"char-{ch.CharacterID}",
            Name=ch.Name,
            Description=ch.Description,
            CardImageUrl=ch.CardImageUrl,
            PromptJson=ch.PromptJson,
            State="Approved" if ch.State == "Approved" else "Draft"
        )
        db.add(clone)

    db.commit()
    db.refresh(proj)
    return proj

def promote_character_to_canon(db: Session, project_character_id: int) -> None:
    proj_char = db.query(Character).filter(Character.CharacterID == project_character_id).one()
    if not proj_char.FranchiseID:
        raise ValueError("Character is not linked to a franchise.")

    canonical = (
        db.query(Character)
        .filter(
            Character.FranchiseID == proj_char.FranchiseID,
            Character.ProjectID == None,
            Character.CanonicalKey == proj_char.CanonicalKey
        )
        .one_or_none()
    )

    if canonical is None:
        canonical = Character(
            ProjectID=None,
            FranchiseID=proj_char.FranchiseID,
            CanonicalKey=proj_char.CanonicalKey,
            Name=proj_char.Name,
            Description=proj_char.Description,
            CardImageUrl=proj_char.CardImageUrl,
            PromptJson=proj_char.PromptJson,
            State="Approved"
        )
        db.add(canonical)
    else:
        canonical.Name = proj_char.Name
        canonical.Description = proj_char.Description
        canonical.CardImageUrl = proj_char.CardImageUrl
        canonical.PromptJson = proj_char.PromptJson
        canonical.State = "Approved"

    fran = db.query(Franchise).filter(Franchise.FranchiseID == proj_char.FranchiseID).one()
    fran.Version = (fran.Version or 0) + 1

    db.commit()
