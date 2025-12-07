from fastapi import APIRouter, HTTPException
from pathlib import Path
import json
from datetime import datetime

from app.config import settings
from app.models.sounds import (
    SoundGenerateRequest,
    SoundApproveRequest,
    SoundResponse,
    PendingSoundsResponse,
    SoundMetadata,
    SoundStatus
)
from app.core.elevenlabs_client import elevenlabs_client
from app.core.audio_processor import audio_processor

router = APIRouter()


@router.post("/generate", response_model=SoundResponse)
async def generate_sound(request: SoundGenerateRequest):
    """
    Generate a new sound effect using 11Labs.
    Sound goes to pending queue for approval.
    """
    if not elevenlabs_client.is_configured:
        raise HTTPException(
            status_code=503,
            detail="11Labs API not configured. Set ELEVENLABS_API_KEY in .env"
        )

    try:
        # Generate sound
        audio_bytes, metadata = await elevenlabs_client.generate_sound_effect(
            prompt=request.prompt,
            duration=request.duration,
            category=request.category,
            tags=request.tags,
            context=request.context
        )

        # Save to pending
        audio_path = await elevenlabs_client.save_to_pending(audio_bytes, metadata)

        return SoundResponse(
            id=metadata.id,
            status=SoundStatus.PENDING,
            metadata=metadata,
            audio_url=f"/static/pending/{metadata.id}.mp3"
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/pending", response_model=PendingSoundsResponse)
async def get_pending_sounds():
    """Get all sounds waiting for approval."""
    pending_dir = settings.pending_dir

    if not pending_dir.exists():
        return PendingSoundsResponse(pending=[], count=0)

    pending_sounds = []
    for meta_file in pending_dir.glob("*.json"):
        try:
            with open(meta_file) as f:
                meta_dict = json.load(f)
                metadata = SoundMetadata(**meta_dict)

            pending_sounds.append(SoundResponse(
                id=metadata.id,
                status=SoundStatus.PENDING,
                metadata=metadata,
                audio_url=f"/static/pending/{metadata.id}.mp3"
            ))
        except Exception:
            continue  # Skip malformed files

    # Sort by creation date (newest first)
    pending_sounds.sort(key=lambda x: x.metadata.created_at, reverse=True)

    return PendingSoundsResponse(
        pending=pending_sounds,
        count=len(pending_sounds)
    )


@router.get("/status/{sound_id}", response_model=SoundResponse)
async def get_sound_status(sound_id: str):
    """Get status of a specific sound."""
    pending_meta = settings.pending_dir / f"{sound_id}.json"

    # Check pending
    if pending_meta.exists():
        with open(pending_meta) as f:
            meta_dict = json.load(f)
            metadata = SoundMetadata(**meta_dict)

        return SoundResponse(
            id=metadata.id,
            status=SoundStatus.PENDING,
            metadata=metadata,
            audio_url=f"/static/pending/{metadata.id}.mp3"
        )

    # Check approved (search by ID in filename)
    output_dir = settings.approved_output_dir / "sounds"
    if output_dir.exists():
        for category_dir in output_dir.iterdir():
            if category_dir.is_dir():
                for meta_file in category_dir.glob(f"*{sound_id}*.json"):
                    with open(meta_file) as f:
                        meta_dict = json.load(f)

                    wav_file = meta_file.with_suffix(".wav")
                    return SoundResponse(
                        id=sound_id,
                        status=SoundStatus.APPROVED,
                        metadata=SoundMetadata(**{k: v for k, v in meta_dict.items() if k in SoundMetadata.model_fields}),
                        output_path=str(wav_file)
                    )

    raise HTTPException(status_code=404, detail=f"Sound not found: {sound_id}")


@router.post("/{sound_id}/approve", response_model=SoundResponse)
async def approve_sound(sound_id: str, request: SoundApproveRequest = None):
    """
    Approve a pending sound and process it for game use.
    Applies volume normalization, trimming, and fades.
    """
    if request is None:
        request = SoundApproveRequest()

    try:
        # Load pending sound
        audio, metadata = audio_processor.load_pending_sound(sound_id)

        # Process audio
        processed_audio = audio_processor.process_sound(audio, request)

        # Save to approved location
        output_path = audio_processor.save_approved(
            processed_audio,
            metadata,
            request.custom_name
        )

        # Delete from pending
        audio_processor.delete_pending(sound_id)

        return SoundResponse(
            id=metadata.id,
            status=SoundStatus.APPROVED,
            metadata=metadata,
            output_path=str(output_path)
        )

    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Sound not found: {sound_id}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{sound_id}/reject")
async def reject_sound(sound_id: str):
    """Reject and delete a pending sound."""
    try:
        audio_processor.delete_pending(sound_id)
        return {"status": "rejected", "id": sound_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{sound_id}/regenerate", response_model=SoundResponse)
async def regenerate_sound(sound_id: str, tweaks: SoundGenerateRequest = None):
    """
    Regenerate a sound with optional tweaks to the prompt.
    Deletes the old pending sound and creates a new one.
    """
    # Load original metadata to get base prompt if no tweaks provided
    try:
        _, original_metadata = audio_processor.load_pending_sound(sound_id)

        # Use original values if not provided
        if tweaks is None:
            tweaks = SoundGenerateRequest(
                prompt=original_metadata.prompt,
                duration=original_metadata.duration,
                category=original_metadata.category,
                tags=original_metadata.tags,
                context=original_metadata.context
            )

        # Delete old sound
        audio_processor.delete_pending(sound_id)

        # Generate new one
        return await generate_sound(tweaks)

    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Sound not found: {sound_id}")
