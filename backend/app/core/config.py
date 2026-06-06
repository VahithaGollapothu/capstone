import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "ArchGen AI"
    API_V1_STR: str = "/api/v1"
    
    # Environment Variables (with fallback defaults)
    MONGODB_URI: str = os.getenv("MONGODB_URI", "mongodb://localhost:27017/archgen")
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    # New API tokens for visual generation
    REPLICATE_API_TOKEN: str = os.getenv("REPLICATE_API_TOKEN", "")
    REPLICATE_MODEL_VERSION: str = os.getenv("REPLICATE_MODEL_VERSION", "")
    STABILITY_API_KEY: str = os.getenv("STABILITY_API_KEY", "")
    STABILITY_ENGINE_ID: str = os.getenv("STABILITY_ENGINE_ID", "stable-diffusion-v1-5")
    FRONTEND_ORIGINS: str = os.getenv(
        "FRONTEND_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000"
    )

    @property
    def CORS_ORIGINS(self) -> list[str]:
        return [origin.strip() for origin in self.FRONTEND_ORIGINS.split(",") if origin.strip()]
    
    # Auto-detection for Mock Mode
    @property
    def IS_MOCK_MODE(self) -> bool:
        return not self.GROQ_API_KEY or self.GROQ_API_KEY.lower() in ("mock", "placeholder", "")

settings = Settings()
