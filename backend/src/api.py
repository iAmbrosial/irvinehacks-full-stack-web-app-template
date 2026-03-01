"""
This file defines the FastAPI app for the API and all of its routes.
To run this API, use the FastAPI CLI:
  $ fastapi dev src/api.py
"""

import os
import random
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from squat_detector import SquatDetector

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        # "https://your-app.onrender.com",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

# is_visible() is still used as a guard before passing landmarks to SquatDetector.
# MediaPipe can produce "ghost" landmarks at the edge of frame with low visibility
# scores — filtering these out prevents bad angle calculations.

def is_visible(lm: dict, threshold: float = 0.75) -> bool:
    """
    Return True only when MediaPipe is confident this landmark is real.
    threshold > 0.75 filters ghost points caused by occlusion or being at
    the edge of frame. y < 0.95 filters landmarks clipped at the bottom.
    """
    return lm["visibility"] > threshold and lm["y"] < 0.95


# FastAPI validates all incoming requests against these models automatically
# and returns a 422 with a clear error message if the shape is wrong

class Landmark(BaseModel):
    """One of the 33 body keypoints MediaPipe Pose produces per frame."""
    id: int
    name: str = ""      # optional — MediaPipe JS doesn't expose landmark names
    x: float            # normalized [0, 1] relative to frame width
    y: float            # normalized [0, 1] relative to frame height
    z: float            # depth estimate (less reliable than x/y)
    visibility: float   # confidence [0, 1]


class RealtimeRequest(BaseModel):
    """
    Sent from the frontend every N frames.
    Recommended: every 10 frames at 30 fps = 3 POSTs/second.
    Sending every frame would create unnecessary server load and the LLM
    is not involved here, so latency is low anyway.
    """
    session_id: str
    timestamp: int
    fps: int
    exercise: str # "squat" | "lunge" | "pushup" | "plank"
    landmarks: list[Landmark]


class RealtimeResponse(BaseModel):
    """Immediate rule-based response — no LLM."""
    detected_action: str
    confidence: float # 0.0–1.0
    is_standard: bool
    realtime_feedback: str
    # Fields populated by SquatDetector (squat only for now)
    reps: int = 0
    state: str = "up"           # "up" | "down" — current phase of rep
    form_issues: list[str] = [] # non-empty only on rep_completed frames
    rep_completed: bool = False  # True on the frame a rep is counted


class WorkoutSummary(BaseModel):
    """
    Sent once when the user clicks 'Finish Workout'.
    Accumulated over the full session by the frontend.
    Fields with defaults are optional for now — the MediaPipe team will
    populate rep_count, avg_accuracy_score, and issues as those features
    are built out.
    """
    session_id: str = "anonymous"
    exercise_id: str
    exercise_name: str
    duration_seconds: int
    rep_count: int = 0
    valid_reps: int = 0
    avg_accuracy_score: float = 0.0
    max_depth_pct: float = 0.0      # 0–100, how close to 90° knee angle
    symmetry_score: float = 100.0   # 100 = perfectly symmetric left/right
    issues: list[str] = []          # e.g. ["knee cave", "rounded back"]


# ── Section 4: Demo routes ────────────────────────────────────────────────────

@app.get("/hello")
async def hello() -> dict[str, str]:
    return {"message": "Hello from FastAPI"}


@app.get("/random")
async def get_random_item(maximum: int) -> dict[str, int]:
    return {"itemId": random.randint(0, maximum)}

#
# To add a new exercise: add an elif block following the squat pattern,
# and create a matching detector class in its own file.

# session_id → SquatDetector instance
_sessions: dict[str, SquatDetector] = {}

@app.post("/realtime-feedback", response_model=RealtimeResponse)
async def realtime_feedback(data: RealtimeRequest) -> RealtimeResponse:
    lm = {pt.id: pt.model_dump() for pt in data.landmarks}

    if data.exercise == "squat":
        # Landmark ids: 23=L.hip, 24=R.hip, 25=L.knee, 26=R.knee,
        #               27=L.ankle, 28=R.ankle
        right_ok = all(k in lm for k in [24, 26, 28]) and is_visible(lm[26]) and is_visible(lm[28])
        left_ok  = all(k in lm for k in [23, 25, 27]) and is_visible(lm[25]) and is_visible(lm[27])

        if not right_ok and not left_ok:
            return RealtimeResponse(
                detected_action="squat", confidence=0.3, is_standard=False,
                realtime_feedback="Step back — full body must be in frame",
                reps=_sessions.get(data.session_id, SquatDetector()).rep_count,
            )

        # Get or create a SquatDetector for this session
        if data.session_id not in _sessions:
            _sessions[data.session_id] = SquatDetector()
        detector = _sessions[data.session_id]

        result = detector.process_frame(lm)

        knee = result["metrics"]["knee_angle"]
        issues = result["form_issues"]
        # "Excellent squat form!" is the success message — not an issue
        has_real_issues = issues and issues != ["Excellent squat form! Keep it up."]

        # Live angle cue shown every frame (not just on rep completion)
        if knee > 160:
            cue = "Brace core, begin descent"
        elif knee > 100:
            cue = f"Go lower — {knee:.0f}°, aim for 90°"
        elif knee >= 70:
            cue = f"Good depth at {knee:.0f}°! Drive through heels"
        else:
            cue = "Too deep — ease back up"

        return RealtimeResponse(
            detected_action="squat",
            confidence=0.9 if (right_ok and left_ok) else 0.7,
            is_standard=not has_real_issues,
            realtime_feedback=cue,
            reps=result["reps"],
            state=result["state"],
            # Only surface form_issues on the frame a rep is completed —
            # that's when evaluate_form() runs and the issues are meaningful
            form_issues=issues if result["rep_completed"] else [],
            rep_completed=result["rep_completed"],
        )

    # Fallback for exercises without rules yet
    return RealtimeResponse(
        detected_action=data.exercise, confidence=0.5, is_standard=True,
        realtime_feedback="Keep moving — tracking active",
    )

def build_prompt(data: WorkoutSummary) -> str:
    """Translate session numbers into a natural-language coaching prompt."""

    issues_text = (
        "No specific form issues were flagged."
        if not data.issues
        else "Detected form issues: " + "; ".join(data.issues) + "."
    )

    symmetry_note = (
        "Left/right movement was symmetrical."
        if data.symmetry_score >= 95
        else f"Asymmetry detected — symmetry score {data.symmetry_score:.0f}%. "
             "The user may be compensating on one side."
    )

    # Exercise-specific standards give Claude the reference point it needs.
    # Without this, Claude gives generic advice. With it, it can say exactly
    # what threshold was missed and why that threshold exists.
    standards = {
        "squat": (
            "Correct squat: knees track over toes (not inward), torso stays "
            "upright (lean < 30° from vertical), depth reaches 90° knee angle, "
            "heels flat throughout. Knee cave causes ACL/MCL stress. Rounded "
            "lower back risks disc herniation."
        ),
        "lunge": (
            "Correct lunge: front shin vertical, front knee does not pass toes, "
            "back knee hovers near floor, torso upright. Both knees near 90° at "
            "bottom. Knee-past-toes increases patellar tendon load."
        ),
        "pushup": (
            "Correct push-up: straight line head to heels (no sagging hips, no "
            "piked hips), elbows ~45° from torso, chest near floor at bottom, "
            "full extension at top. Sagging core strains lumbar spine."
        ),
        "plank": (
            "Correct plank: hips level with shoulders, core braced, glutes "
            "engaged, breathing steady. Sagging hips shift load to lumbar spine."
        ),
    }
    standard = standards.get(data.exercise_id, "Apply standard good form.")

    return f"""You are an expert personal trainer and sports physiotherapist.
Analyse this workout and give specific, actionable coaching in under 180 words.
Be encouraging but direct.

=== EXERCISE STANDARD (what correct form looks like) ===
{standard}

=== SESSION DATA ===
Exercise: {data.exercise_name}
Duration: {data.duration_seconds}s
Total reps: {data.rep_count}  |  Valid reps (good form): {data.valid_reps}
Average form accuracy: {data.avg_accuracy_score:.0f}/100
Max squat depth reached: {data.max_depth_pct:.0f}% of ideal (100% = 90° knee angle)
{symmetry_note}
{issues_text}

=== YOUR RESPONSE FORMAT ===
1. What they did well (1–2 sentences)
2. The single most important correction — state specifically WHY it prevents injury
3. One measurable goal for the next session (a number or specific target)"""


@app.post("/analyze-workout")
async def analyze_workout(data: WorkoutSummary) -> dict:
    """Accepts a full session summary, returns structured AI coaching feedback."""
    api_key = os.environ.get("ANTHROPIC_API_KEY")

    # Clean up the session detector when the workout ends —
    # the next session will get a fresh SquatDetector with rep_count = 0
    if data.session_id in _sessions:
        del _sessions[data.session_id]

    # Build the structured response shell (same shape regardless of mock/real)
    def make_response(coaching_message: str) -> dict:
        return {
            "summary": {
                "exercise_type": data.exercise_name,
                "total_reps": data.rep_count,
                "valid_reps": data.valid_reps,
                "avg_accuracy_score": data.avg_accuracy_score,
            },
            "biometrics": {
                "max_depth": f"{data.max_depth_pct:.0f}%",
                "stability": "High" if data.avg_accuracy_score > 80 else "Moderate",
                "symmetry_issue": (
                    None if data.symmetry_score >= 95
                    else f"Asymmetry detected ({data.symmetry_score:.0f}% symmetry)"
                ),
            },
            "ai_coaching": {
                "message": coaching_message,
                "tutorial_video": None,
            },
        }

    # ── Mock (no API key) ─────────────────────────────────────────────────────
    if not api_key:
        return make_response(
            f"Great effort on your {data.exercise_name} session! "
            f"You completed {data.rep_count} reps in {data.duration_seconds}s. "
            "Set ANTHROPIC_API_KEY in backend/.env to enable personalised coaching."
        )

    # ── Real LLM call ─────────────────────────────────────────────────────────
    # To swap providers: replace these two lines with your SDK of choice.
    #   OpenAI:  from openai import OpenAI; client = OpenAI()
    #   Gemini:  import google.generativeai as genai
    import anthropic
    client = anthropic.Anthropic(api_key=api_key)
    message = client.messages.create(
        model="claude-opus-4-6",
        max_tokens=350,
        messages=[{"role": "user", "content": build_prompt(data)}],
    )
    return make_response(message.content[0].text)
