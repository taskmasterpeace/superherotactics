import httpx
from pathlib import Path
from typing import Optional
import uuid
from datetime import datetime

from app.config import settings
from app.models.sounds import SoundMetadata, SoundCategory, SoundContext


class ElevenLabsClient:
    """Client for 11Labs Sound Effects API."""

    BASE_URL = "https://api.elevenlabs.io/v1"

    def __init__(self):
        self.api_key = settings.elevenlabs_api_key

    @property
    def is_configured(self) -> bool:
        return bool(self.api_key)

    async def generate_sound_effect(
        self,
        prompt: str,
        duration: float = 2.0,
        category: SoundCategory = SoundCategory.COMBAT,
        tags: list = None,
        context: Optional[SoundContext] = None
    ) -> tuple[bytes, SoundMetadata]:
        """
        Generate a sound effect using 11Labs API.

        Returns tuple of (audio_bytes, metadata)
        """
        if not self.is_configured:
            raise ValueError("11Labs API key not configured")

        sound_id = f"snd_{uuid.uuid4().hex[:8]}"

        # Call 11Labs Sound Effects API
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.BASE_URL}/sound-generation",
                headers={
                    "xi-api-key": self.api_key,
                    "Content-Type": "application/json"
                },
                json={
                    "text": prompt,
                    "duration_seconds": duration,
                    "prompt_influence": 0.5
                },
                timeout=60.0
            )

            if response.status_code != 200:
                raise Exception(f"11Labs API error: {response.status_code} - {response.text}")

            audio_bytes = response.content

        metadata = SoundMetadata(
            id=sound_id,
            prompt=prompt,
            category=category,
            tags=tags or [],
            duration=duration,
            created_at=datetime.utcnow(),
            context=context
        )

        return audio_bytes, metadata

    async def save_to_pending(
        self,
        audio_bytes: bytes,
        metadata: SoundMetadata
    ) -> Path:
        """Save generated audio to pending folder."""
        pending_dir = settings.pending_dir
        pending_dir.mkdir(parents=True, exist_ok=True)

        # Save audio file
        audio_path = pending_dir / f"{metadata.id}.mp3"
        audio_path.write_bytes(audio_bytes)

        # Save metadata
        import json
        meta_path = pending_dir / f"{metadata.id}.json"
        meta_path.write_text(json.dumps(metadata.model_dump(), default=str))

        return audio_path


# Singleton instance
elevenlabs_client = ElevenLabsClient()
