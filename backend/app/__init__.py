# backend/app/__init__.py
from pathlib import Path

ROOT_DIR = Path(__file__).parent.parent
APP_DIR = ROOT_DIR / "app"

# This ensures the app directory is in the Python path
import sys
sys.path.append(str(ROOT_DIR))

from app.core.config import get_settings
settings = get_settings()