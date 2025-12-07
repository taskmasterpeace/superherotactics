from pydantic_settings import BaseSettings
from pathlib import Path


class Settings(BaseSettings):
    # Server
    host: str = "localhost"
    port: int = 8000
    debug: bool = True

    # AI APIs
    elevenlabs_api_key: str = ""
    replicate_api_token: str = ""

    # File Storage
    pending_dir: Path = Path("./static/pending")
    approved_output_dir: Path = Path("C:/git/sht/MVP/public/assets")

    # Processing Defaults
    default_background_color: str = "#2D233C"
    default_tolerance: int = 15
    default_target_size: int = 128
    default_aspect_ratio: float = 0.714

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
