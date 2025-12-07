from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from enum import Enum
from datetime import datetime


class SoundCategory(str, Enum):
    COMBAT = "combat"
    UI = "ui"
    CHARACTER = "character"
    ENVIRONMENT = "environment"
    AMBIENT = "ambient"


class SoundStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    PROCESSING = "processing"
    FAILED = "failed"


class SoundContext(BaseModel):
    """Optional context for sound generation."""
    faction: Optional[str] = None
    environment: Optional[str] = None
    region: Optional[str] = None


class SoundGenerateRequest(BaseModel):
    """Request to generate a new sound effect."""
    prompt: str = Field(..., description="Description of the sound to generate")
    duration: float = Field(default=2.0, ge=0.5, le=22.0, description="Duration in seconds (0.5-22)")
    category: SoundCategory = Field(default=SoundCategory.COMBAT)
    tags: List[str] = Field(default_factory=list)
    context: Optional[SoundContext] = None


class SoundApproveRequest(BaseModel):
    """Request to approve a pending sound."""
    volume_adjustment: float = Field(default=0.0, ge=-20.0, le=20.0, description="dB adjustment")
    trim_start: float = Field(default=0.0, ge=0.0, description="Seconds to trim from start")
    trim_end: float = Field(default=0.0, ge=0.0, description="Seconds to trim from end")
    fade_in: float = Field(default=0.0, ge=0.0, le=2.0, description="Fade in duration")
    fade_out: float = Field(default=0.0, ge=0.0, le=2.0, description="Fade out duration")
    custom_name: Optional[str] = None


class SoundMetadata(BaseModel):
    """Metadata for a generated sound."""
    id: str
    prompt: str
    category: SoundCategory
    tags: List[str]
    duration: float
    created_at: datetime
    context: Optional[SoundContext] = None


class SoundResponse(BaseModel):
    """Response for a single sound."""
    id: str
    status: SoundStatus
    metadata: SoundMetadata
    audio_url: Optional[str] = None
    output_path: Optional[str] = None
    error: Optional[str] = None


class PendingSoundsResponse(BaseModel):
    """Response listing all pending sounds."""
    pending: List[SoundResponse]
    count: int
