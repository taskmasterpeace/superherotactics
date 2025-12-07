# SHT Asset Generator API

Standalone asset generation tool for SuperHero Tactics. Generates sounds, images, and sprites using AI.

## Quick Start

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Configure API keys:**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

3. **Run the server:**
   ```bash
   python -m app.main
   # Or with uvicorn directly:
   uvicorn app.main:app --reload
   ```

4. **Open the UI:**
   - http://localhost:8000/ui/index.html

5. **API Docs:**
   - http://localhost:8000/docs

## Features

### Sound Effects (11Labs)
- Generate sound effects from text descriptions
- Approval workflow with volume normalization
- Auto-save to game assets folder

### Coming Soon
- Portrait generation (Replicate.ai)
- Sprite extraction
- Expression animation

## API Endpoints

### Health
- `GET /api/v1/health` - Check API status
- `GET /api/v1/status` - Detailed feature status

### Sounds
- `POST /api/v1/sounds/generate` - Generate new sound
- `GET /api/v1/sounds/pending` - List pending sounds
- `GET /api/v1/sounds/status/{id}` - Get sound status
- `POST /api/v1/sounds/{id}/approve` - Approve sound
- `POST /api/v1/sounds/{id}/reject` - Reject sound
- `POST /api/v1/sounds/{id}/regenerate` - Regenerate sound

## Claude Code Integration

Once running, Claude Code can call these endpoints:

```bash
# Generate a sound
curl -X POST http://localhost:8000/api/v1/sounds/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "laser gun firing", "duration": 1.0, "category": "combat"}'

# Check pending sounds
curl http://localhost:8000/api/v1/sounds/pending

# Check specific sound status
curl http://localhost:8000/api/v1/sounds/status/snd_abc123
```

## Project Structure

```
sht-asset-api/
├── app/
│   ├── main.py           # FastAPI entry point
│   ├── config.py         # Settings
│   ├── api/v1/           # API routes
│   ├── core/             # Business logic
│   ├── models/           # Pydantic schemas
│   └── services/         # Service layer
├── frontend/             # Web UI
├── static/
│   ├── pending/          # Awaiting approval
│   └── outputs/          # Local outputs
└── claude_templates/     # Claude Code docs
```

## Configuration

Environment variables in `.env`:

| Variable | Description |
|----------|-------------|
| `ELEVENLABS_API_KEY` | 11Labs API key for sound generation |
| `REPLICATE_API_TOKEN` | Replicate.ai token for images |
| `APPROVED_OUTPUT_DIR` | Where approved assets are saved |
| `DEFAULT_BACKGROUND_COLOR` | Background color for sprite extraction (#2D233C) |
