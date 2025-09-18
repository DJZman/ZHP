# AI Film Factory (MSSQL + FastAPI)

Production-grade scaffold for a human-in-the-loop AI video pipeline:
- **MSSQL** for persistence
- **FastAPI** service
- **OpenAI Responses API** (you wire your prompts)
- **Kling providers** (abstracted in `services/kling.py`)
- **ElevenLabs** for TTS/SFX/Music (`services/voices.py`)
- **Cloudflare R2** or S3-compatible storage (`services/storage.py`)
- **ffmpeg** utilities (`services/ffmpeg.py`)

## Quick start

### 1) Prereqs
- Python 3.11+
- ffmpeg installed and on PATH
- SQL Server reachable and a database created
- ODBC Driver 18 for SQL Server

### 2) Apply SQL schema
Run the scripts in `sql/` (in order) on your database:
1. `01_base_schema.sql`
2. `02_franchise_deltas.sql`
3. `03_franchise_voices.sql` (optional)

### 3) Configure environment
Copy `.env.example` to `.env` and set values.

### 4) Install & run
```bash
python -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 5) Create a project from a franchise
POST to:
```
POST http://localhost:8000/projects/from-franchise
{
  "franchise_id": 1,
  "title": "Episode 1",
  "premise": "A scientist finds an alien monolith in a canyon.",
  "target_duration_s": 180,
  "style": "grounded cinematic realism",
  "genre": "sci-fi"
}
```

Response contains `project_id`, `franchise_version`, etc.

## Structure
```
ai-film-factory/
  app/
    api.py
    db.py
    models.py
    services/
      franchise_project.py
      kling.py
      voices.py
      storage.py
      ffmpeg.py
  sql/
    01_base_schema.sql
    02_franchise_deltas.sql
    03_franchise_voices.sql
  main.py
  requirements.txt
  .env.example
  README.md
```

## Notes
- All **continuity** (characters, voices, style rules) lives at the **Franchise** level and is snapshotted into each **Project** when you create a new episode/sequel.
- Use `promote_character_to_canon` to push approved changes back to the franchise bible and bump its version.
- `services/*` are adapters/stubs you can fill with your provider calls.
