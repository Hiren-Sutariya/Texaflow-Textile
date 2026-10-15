import os
import json
from typing import List
from pydantic import BaseModel
from dotenv import load_dotenv

from pathlib import Path

# Load environment variables from backend/.env explicitly
backend_dir = Path(__file__).resolve().parent.parent.parent
dotenv_path = backend_dir / ".env"
if dotenv_path.exists():
    load_dotenv(dotenv_path=dotenv_path)
load_dotenv()

def get_cors_origins() -> List[str]:
    raw = os.getenv("CORS_ORIGINS")
    if not raw:
        return [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "https://localhost:3000",
        ]
    try:
        parsed = json.loads(raw)
        if isinstance(parsed, list):
            return parsed
        return [str(parsed)]
    except Exception:
        return [o.strip() for o in raw.split(",") if o.strip()]

class Settings(BaseModel):
    PROJECT_NAME: str = os.getenv("PROJECT_NAME", "TexaFlow Textile ERP API")
    API_V1_STR: str = os.getenv("API_V1_STR", "/api/v1")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./om_sai.db")
    CORS_ORIGINS: List[str] = get_cors_origins()

settings = Settings()

