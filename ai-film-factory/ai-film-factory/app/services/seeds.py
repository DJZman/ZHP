from sqlalchemy.orm import Session
from app.services.franchise_crud import create_franchise, create_franchise_character, list_franchises

def seed_dev(db: Session) -> dict:
    # If any franchise exists, skip creating a duplicate
    frans = list_franchises(db)
    if frans:
        return {"status": "exists", "franchise_id": frans[0].FranchiseID}

    bible = {
        "visual_style": "grounded cinematic realism, teal-orange palette",
        "props": {"orb": "glowing obsidian sphere with gold veins"},
        "locations": ["orbital lab", "desert canyon", "council chamber"],
        "rules": ["technology is retrofitted, not sleek", "AI speaks monotone"]
    }
    import json
    fran = create_franchise(db, "Eidolon Saga", "Sci-fi arc about a haunted freighter.", json.dumps(bible))
    # Seed two canonical characters
    create_franchise_character(db, fran.FranchiseID, "Dr. Imani Kade",
                               "40s, East African, braided bun, slate flight suit, chest HUD.",
                               None, None, "dr-imani-kade", "Approved")
    create_franchise_character(db, fran.FranchiseID, "Han Chen",
                               "30s, Taiwanese engineer, oil-stained jacket, sardonic.",
                               None, None, "han-chen", "Approved")
    return {"status": "seeded", "franchise_id": fran.FranchiseID}
