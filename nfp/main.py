# main.py — Note Form Pro FastAPI Backend
import os
import json
from datetime import datetime, timedelta
from typing import Optional, List
from fastapi import FastAPI, HTTPException, Depends, Form, UploadFile, File, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, EmailStr, Field
from pydantic_settings import BaseSettings
from supabase import create_client, Client
import jwt
from jose import JWTError
import asyncio
import re
import math

# ============================================================================
# CONFIG
# ============================================================================

class Settings(BaseSettings):
    supabase_url: str = os.getenv("SUPABASE_URL", "")
    supabase_key: str = os.getenv("SUPABASE_KEY", "")
    jwt_secret: str = os.getenv("JWT_SECRET", "dev-secret-change-in-prod")
    environment: str = os.getenv("ENVIRONMENT", "development")
    allowed_origins: list = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8000",
        "https://noteformpro.com"
    ]
    
    class Config:
        env_file = ".env"

settings = Settings()

try:
    supabase: Client = create_client(settings.supabase_url, settings.supabase_key)
except:
    supabase = None
    print("⚠️  Warning: Supabase not configured. Running in demo mode.")

# ============================================================================
# APP INIT
# ============================================================================

app = FastAPI(
    title="Note Form Pro API",
    version="0.1.0",
    description="CROMUS Parser + RNG Renderer for Music Education"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================================
# MODELS
# ============================================================================

class ScoreCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    composer: Optional[str] = None
    cromus_source: str = Field(..., min_length=1)
    visibility: str = "private"

class ScoreUpdate(BaseModel):
    title: Optional[str] = None
    composer: Optional[str] = None
    cromus_source: Optional[str] = None
    visibility: Optional[str] = None

class ScoreResponse(BaseModel):
    id: str
    user_id: str
    title: str
    composer: Optional[str]
    cromus_source: str
    rendered_svg: Optional[str]
    metadata: dict
    visibility: str
    created_at: str
    updated_at: str

class UserRegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)

class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str

# ============================================================================
# CROMUS PARSER (production-grade)
# ============================================================================

class CromusEvent:
    def __init__(self, event_type, degree=None, duration=1.0, raw=""):
        self.type = event_type  # "note", "rest", "barline"
        self.degree = degree     # 1-7
        self.octave = 4
        self.accidental = ""
        self.duration = duration
        self.raw = raw

    def to_dict(self):
        return {
            "type": self.type,
            "degree": self.degree,
            "octave": self.octave,
            "accidental": self.accidental,
            "duration": self.duration,
            "raw": self.raw
        }

def parse_cromus(source: str) -> tuple[List[CromusEvent], List[str]]:
    """Parse CROMUS syntax. Returns (events, errors)."""
    events = []
    errors = []
    
    lines = source.strip().split('\n')
    
    for line_num, line in enumerate(lines, 1):
        clean = line.split('//')[0].strip()
        if not clean:
            continue
        
        # METRICA command
        if re.match(r'^METRICA\s+\d+', clean, re.IGNORECASE):
            continue
        
        # Parse notes and rests
        segments = re.split(r'(\|{1,3})', clean)
        for seg in segments:
            seg = seg.strip()
            if not seg or re.match(r'^\|+$', seg):
                if seg:
                    events.append(CromusEvent("barline", raw=seg))
                continue
            
            beats = seg.split(',')
            for beat in beats:
                beat = beat.strip()
                if not beat:
                    continue
                
                # Extract degrees 1-7
                degrees = re.findall(r'[1-7]', beat)
                for deg in degrees:
                    d = int(deg)
                    if 1 <= d <= 7:
                        events.append(CromusEvent("note", degree=d))
                    else:
                        errors.append(f"Line {line_num}: Invalid degree {d}")
                
                # Check for rest
                if '-' in beat and not degrees:
                    events.append(CromusEvent("rest"))
    
    if not events:
        errors.append("No valid notes or rests found")
    
    return events, errors

# ============================================================================
# SVG RENDERER
# ============================================================================

RNG_MAP = {
    1: {"note": "Dó", "shape": "circle", "color": "#D9534F", "emotion": "Amor"},
    2: {"note": "Ré", "shape": "eye", "color": "#F0AD4E", "emotion": "Alegria"},
    3: {"note": "Mi", "shape": "triangle", "color": "#F89406", "emotion": "Criatividade"},
    4: {"note": "Fá", "shape": "square", "color": "#6BCB77", "emotion": "Paz"},
    5: {"note": "Sol", "shape": "star", "color": "#4D96FF", "emotion": "Esperança"},
    6: {"note": "Lá", "shape": "hexagon", "color": "#DAA520", "emotion": "Sabedoria"},
    7: {"note": "Si", "shape": "pentagon", "color": "#9B59B6", "emotion": "Transcendência"},
}

def draw_shape(x, y, r, shape, color):
    """Generate SVG path for a shape."""
    stroke = 'stroke="rgba(0,0,0,0.2)" stroke-width="1"'
    
    if shape == "circle":
        return f'<circle cx="{x}" cy="{y}" r="{r}" fill="{color}" {stroke}/>'
    
    elif shape == "eye":
        return f'<path d="M {x-r} {y} Q {x} {y-r*1.2} {x+r} {y} Q {x} {y+r*1.2} {x-r} {y} Z" fill="{color}" {stroke}/>'
    
    elif shape == "triangle":
        h = r * 1.8
        pts = f"{x},{y-h/2} {x-r},{y+h/2} {x+r},{y+h/2}"
        return f'<polygon points="{pts}" fill="{color}" {stroke}/>'
    
    elif shape == "square":
        s = r * 1.4
        return f'<rect x="{x-s/2}" y="{y-s/2}" width="{s}" height="{s}" fill="{color}" {stroke}/>'
    
    elif shape == "star":
        pts = []
        for i in range(10):
            rad = r if i % 2 == 0 else r * 0.4
            angle = (math.pi * 2 / 10) * i - math.pi / 2
            pts.append(f"{x + rad * math.cos(angle)},{y + rad * math.sin(angle)}")
        return f'<polygon points="{" ".join(pts)}" fill="{color}" {stroke}/>'
    
    elif shape == "hexagon":
        pts = []
        for i in range(6):
            angle = (math.pi * 2 / 6) * i - math.pi / 2
            pts.append(f"{x + r * math.cos(angle)},{y + r * math.sin(angle)}")
        return f'<polygon points="{" ".join(pts)}" fill="{color}" {stroke}/>'
    
    elif shape == "pentagon":
        pts = []
        for i in range(5):
            angle = (math.pi * 2 / 5) * i - math.pi / 2
            pts.append(f"{x + r * math.cos(angle)},{y + r * math.sin(angle)}")
        return f'<polygon points="{" ".join(pts)}" fill="{color}" {stroke}/>'
    
    return f'<circle cx="{x}" cy="{y}" r="{r}" fill="{color}" {stroke}/>'

def render_rng_svg(events: List[CromusEvent], width=None) -> str:
    """Render CROMUS events as RNG SVG."""
    visual_events = [e for e in events if e.type in ("note", "rest")]
    
    if not visual_events:
        return '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100"><text x="50%" y="50%" text-anchor="middle" fill="gray">No notes</text></svg>'
    
    spacing = 70
    margin = 40
    shape_r = 24
    h = 160
    if width is None:
        width = margin * 2 + max(len(visual_events), 1) * spacing
    cy = h // 2
    
    elements = []
    elements.append(f'<rect width="100%" height="100%" fill="white"/>')
    elements.append(f'<line x1="{margin}" y1="{cy + shape_r + 8}" x2="{width - margin}" y2="{cy + shape_r + 8}" stroke="rgba(0,0,0,0.1)" stroke-width="0.5"/>')
    
    for i, evt in enumerate(visual_events):
        cx = margin + i * spacing
        
        if evt.type == "rest":
            elements.append(f'<line x1="{cx-12}" y1="{cy}" x2="{cx+12}" y2="{cy}" stroke="rgba(0,0,0,0.3)" stroke-width="2" stroke-linecap="round"/>')
            elements.append(f'<text x="{cx}" y="{cy + shape_r + 24}" text-anchor="middle" font-size="10" fill="rgba(0,0,0,0.5)">−</text>')
            continue
        
        rng = RNG_MAP.get(evt.degree, RNG_MAP[1])
        elements.append(draw_shape(cx, cy, shape_r, rng["shape"], rng["color"]))
        elements.append(f'<text x="{cx}" y="{cy + 7}" text-anchor="middle" font-size="12" font-weight="bold" fill="white">{evt.degree}</text>')
        elements.append(f'<text x="{cx}" y="{cy + shape_r + 22}" text-anchor="middle" font-size="11" fill="rgba(0,0,0,0.6)">{rng["note"]}</text>')
    
    svg = f'<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{h}" viewBox="0 0 {width} {h}">{"".join(elements)}</svg>'
    return svg

# ============================================================================
# AUTH MIDDLEWARE
# ============================================================================

async def get_current_user(authorization: Optional[str] = Header(None)):
    """Extract and verify JWT token from Authorization header."""
    if not supabase:
        return {"id": "demo-user", "email": "demo@example.com"}
    
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token")
    
    token = authorization.split(" ")[1]
    try:
        response = supabase.auth.get_user(token)
        return response.user
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")

# ============================================================================
# API ENDPOINTS
# ============================================================================

@app.get("/health")
async def health():
    """Health check."""
    return {"status": "ok", "service": "Note Form Pro API", "version": "0.1.0"}

@app.post("/api/auth/register")
async def register(body: UserRegisterRequest):
    """Register new user."""
    if not supabase:
        return {"user_id": "demo-id", "email": body.email, "message": "Demo mode - registration not available"}
    
    try:
        response = supabase.auth.sign_up({
            "email": body.email,
            "password": body.password,
        })
        return {
            "user_id": response.user.id,
            "email": response.user.email,
            "message": "Registration successful. Check email for confirmation."
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/auth/login")
async def login(body: UserLoginRequest):
    """Login user."""
    if not supabase:
        return {
            "access_token": "demo-token",
            "refresh_token": "demo-refresh",
            "user_id": "demo-user",
            "email": body.email,
        }
    
    try:
        response = supabase.auth.sign_in_with_password({
            "email": body.email,
            "password": body.password,
        })
        return {
            "access_token": response.session.access_token,
            "refresh_token": response.session.refresh_token,
            "user_id": response.user.id,
            "email": response.user.email,
        }
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid credentials")

@app.post("/api/scores")
async def create_score(
    score: ScoreCreate,
    authorization: Optional[str] = Header(None)
):
    """Create a new score."""
    user = await get_current_user(authorization)
    
    events, errors = parse_cromus(score.cromus_source)
    svg = render_rng_svg(events)
    
    if not supabase:
        return {
            "id": "demo-score-id",
            "user_id": user.get("id", "demo-user"),
            "title": score.title,
            "composer": score.composer,
            "cromus_source": score.cromus_source,
            "rendered_svg": svg,
            "metadata": {"note_count": len([e for e in events if e.type == "note"])},
            "visibility": score.visibility,
        }
    
    try:
        response = supabase.table("scores").insert({
            "user_id": user.id,
            "title": score.title,
            "composer": score.composer,
            "cromus_source": score.cromus_source,
            "rendered_svg": svg,
            "metadata": {
                "note_count": len([e for e in events if e.type == "note"]),
                "parse_errors": errors
            },
            "visibility": score.visibility,
        }).execute()
        
        return response.data[0] if response.data else {"error": "Failed to create score"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/scores")
async def list_scores(authorization: Optional[str] = Header(None)):
    """List user's scores."""
    user = await get_current_user(authorization)
    
    if not supabase:
        return [{"id": "demo-1", "title": "Brilha Estrelinha", "user_id": user.get("id")}]
    
    try:
        user_id = user.id if hasattr(user, 'id') else user.get("id")
        response = supabase.table("scores").select("*").eq(
            "user_id", user_id
        ).order("created_at", desc=True).execute()
        
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/scores/{score_id}")
async def get_score(score_id: str, authorization: Optional[str] = Header(None)):
    """Get a specific score."""
    user = await get_current_user(authorization)
    
    if not supabase:
        return {"id": score_id, "title": "Demo Score", "user_id": user.get("id")}
    
    try:
        response = supabase.table("scores").select("*").eq("id", score_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Score not found")
        
        score = response.data[0]
        user_id = user.id if hasattr(user, 'id') else user.get("id")
        if score["user_id"] != user_id and score["visibility"] == "private":
            raise HTTPException(status_code=403, detail="Access denied")
        
        return score
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/scores/{score_id}")
async def update_score(
    score_id: str,
    updates: ScoreUpdate,
    authorization: Optional[str] = Header(None)
):
    """Update a score."""
    user = await get_current_user(authorization)
    
    if not supabase:
        return {"id": score_id, "title": updates.title or "Updated"}
    
    try:
        user_id = user.id if hasattr(user, 'id') else user.get("id")
        existing = supabase.table("scores").select("user_id").eq("id", score_id).execute()
        if not existing.data or existing.data[0]["user_id"] != user_id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        update_data = {}
        if updates.title:
            update_data["title"] = updates.title
        if updates.composer is not None:
            update_data["composer"] = updates.composer
        if updates.cromus_source:
            update_data["cromus_source"] = updates.cromus_source
            events, errors = parse_cromus(updates.cromus_source)
            update_data["rendered_svg"] = render_rng_svg(events)
            update_data["metadata"] = {
                "note_count": len([e for e in events if e.type == "note"]),
                "parse_errors": errors
            }
        if updates.visibility:
            update_data["visibility"] = updates.visibility
        
        update_data["updated_at"] = datetime.utcnow().isoformat()
        
        response = supabase.table("scores").update(update_data).eq("id", score_id).execute()
        return response.data[0] if response.data else {"error": "Update failed"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/scores/{score_id}")
async def delete_score(score_id: str, authorization: Optional[str] = Header(None)):
    """Delete a score."""
    user = await get_current_user(authorization)
    
    if not supabase:
        return {"message": "Score deleted"}
    
    try:
        user_id = user.id if hasattr(user, 'id') else user.get("id")
        existing = supabase.table("scores").select("user_id").eq("id", score_id).execute()
        if not existing.data or existing.data[0]["user_id"] != user_id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        supabase.table("scores").delete().eq("id", score_id).execute()
        return {"message": "Score deleted"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/parse")
async def parse_notation(cromus_source: str = Form(...)):
    """Parse CROMUS notation (no auth required for demo)."""
    events, errors = parse_cromus(cromus_source)
    return {
        "events": [e.to_dict() for e in events],
        "errors": errors,
        "note_count": len([e for e in events if e.type == "note"]),
    }

@app.post("/api/render")
async def render_notation(cromus_source: str = Form(...)):
    """Render CROMUS to SVG (no auth required for demo)."""
    events, errors = parse_cromus(cromus_source)
    svg = render_rng_svg(events)
    
    return {
        "svg": svg,
        "errors": errors,
        "note_count": len([e for e in events if e.type == "note"]),
    }

@app.get("/api/rng-map")
async def get_rng_map():
    """Get the RNG shape/color mapping."""
    return RNG_MAP

# ============================================================================
# Run: uvicorn main:app --reload --host 0.0.0.0 --port 8000
# ============================================================================
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
