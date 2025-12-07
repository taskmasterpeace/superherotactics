from pathlib import Path
from typing import Optional
import json
from datetime import datetime

from pydub import AudioSegment
from pydub.effects import normalize

from app.config import settings
from app.models.sounds import SoundMetadata, SoundApproveRequest


class AudioProcessor:
    """Process and manipulate audio files."""

    def __init__(self):
        self.pending_dir = settings.pending_dir
        self.output_dir = settings.approved_output_dir

    def load_pending_sound(self, sound_id: str) -> tuple[AudioSegment, SoundMetadata]:
        """Load a pending sound and its metadata."""
        audio_path = self.pending_dir / f"{sound_id}.mp3"
        meta_path = self.pending_dir / f"{sound_id}.json"

        if not audio_path.exists():
            raise FileNotFoundError(f"Sound not found: {sound_id}")

        audio = AudioSegment.from_mp3(str(audio_path))

        with open(meta_path) as f:
            meta_dict = json.load(f)
            metadata = SoundMetadata(**meta_dict)

        return audio, metadata

    def process_sound(
        self,
        audio: AudioSegment,
        request: SoundApproveRequest
    ) -> AudioSegment:
        """Apply processing to audio based on approval request."""
        # Trim start
        if request.trim_start > 0:
            trim_ms = int(request.trim_start * 1000)
            audio = audio[trim_ms:]

        # Trim end
        if request.trim_end > 0:
            trim_ms = int(request.trim_end * 1000)
            audio = audio[:-trim_ms]

        # Normalize volume
        audio = normalize(audio)

        # Volume adjustment
        if request.volume_adjustment != 0:
            audio = audio + request.volume_adjustment

        # Fade in
        if request.fade_in > 0:
            fade_ms = int(request.fade_in * 1000)
            audio = audio.fade_in(fade_ms)

        # Fade out
        if request.fade_out > 0:
            fade_ms = int(request.fade_out * 1000)
            audio = audio.fade_out(fade_ms)

        return audio

    def generate_filename(self, metadata: SoundMetadata, custom_name: Optional[str] = None) -> str:
        """Generate output filename from metadata."""
        if custom_name:
            # Sanitize custom name
            safe_name = "".join(c if c.isalnum() or c in "-_" else "_" for c in custom_name)
            return f"{safe_name}_{metadata.id}.wav"

        # Generate from prompt
        prompt_slug = metadata.prompt[:30].lower()
        prompt_slug = "".join(c if c.isalnum() or c in " -" else "" for c in prompt_slug)
        prompt_slug = prompt_slug.strip().replace(" ", "_")

        return f"{prompt_slug}_{metadata.id}.wav"

    def save_approved(
        self,
        audio: AudioSegment,
        metadata: SoundMetadata,
        custom_name: Optional[str] = None
    ) -> Path:
        """Save processed audio to approved output directory."""
        # Create category subdirectory
        category_dir = self.output_dir / "sounds" / metadata.category.value
        category_dir.mkdir(parents=True, exist_ok=True)

        # Generate filename
        filename = self.generate_filename(metadata, custom_name)
        output_path = category_dir / filename

        # Export as WAV (game-ready format)
        audio.export(str(output_path), format="wav")

        # Save metadata alongside
        meta_path = output_path.with_suffix(".json")
        with open(meta_path, "w") as f:
            json.dump({
                **metadata.model_dump(),
                "approved_at": datetime.utcnow().isoformat(),
                "output_file": filename,
                "duration_final": len(audio) / 1000.0
            }, f, default=str, indent=2)

        return output_path

    def delete_pending(self, sound_id: str):
        """Delete a pending sound (after approval or rejection)."""
        audio_path = self.pending_dir / f"{sound_id}.mp3"
        meta_path = self.pending_dir / f"{sound_id}.json"

        if audio_path.exists():
            audio_path.unlink()
        if meta_path.exists():
            meta_path.unlink()


# Singleton instance
audio_processor = AudioProcessor()
