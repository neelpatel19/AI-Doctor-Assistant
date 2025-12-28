from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import List

class Settings(BaseSettings):
    # OpenAI
    OPENAI_API_KEY: str
    
    # ChromaDB
    CHROMA_PERSIST_PATH: str = "chromadb_store"
    COLLECTION_NAME: str = "medical_knowledge"
    
    # API Settings
    API_TITLE: str = "AI Doctor API"
    API_VERSION: str = "1.0.0"
    DEBUG: bool = False
    
    # CORS
    ALLOWED_ORIGINS: List[str] = ["*"]
    
    class Config:
        env_file = ".env"
        case_sensitive = True

@lru_cache()
def get_settings():
    return Settings()

settings = get_settings()
