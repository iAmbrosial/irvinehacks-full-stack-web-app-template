import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# --- 1. 导入所有探测器类 ---
from squat_detector import SquatDetector
from forward_lunge_detector import ForwardLungeDetector
from push_up_detector import PushUpDetector
from plank_detector import PlankDetector

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 2. 数据模型定义 ---

class Landmark(BaseModel):
    id: int
    name: str = ""
    x: float
    y: float
    z: float
    visibility: float

class RealtimeRequest(BaseModel):
    session_id: str
    timestamp: int
    fps: int
    exercise: str  # 前端传入的动作标签
    landmarks: list[Landmark]

class RealtimeResponse(BaseModel):
    detected_action: str
    confidence: float
    is_standard: bool
    realtime_feedback: str
    reps: int = 0
    state: str = "up"
    form_issues: list[str] = []
    rep_completed: bool = False

class WorkoutSummary(BaseModel):
    session_id: str = "anonymous"
    exercise_id: str
    exercise_name: str
    duration_seconds: int
    rep_count: int = 0
    valid_reps: int = 0
    avg_accuracy_score: float = 0.0
    max_depth_pct: float = 0.0
    symmetry_score: float = 100.0
    issues: list[str] = []

# --- 3. 核心逻辑：动作映射与实例管理 ---

# 建立标签与类的映射（这里的 Key 必须和前端下拉菜单的 value 一致）
EXERCISE_MAP = {
    "Squat": SquatDetector,
    "Forward Lunge": ForwardLungeDetector,
    "Push-Up": PushUpDetector,
    "Plank": PlankDetector
}

# 存储 session_id_exercise -> Detector 实例
_sessions: dict[str, object] = {}

@app.post("/realtime-feedback", response_model=RealtimeResponse)
async def realtime_feedback(data: RealtimeRequest) -> RealtimeResponse:
    lm = {pt.id: pt.model_dump() for pt in data.landmarks}

    # 使用 session_id + exercise 作为 Key，实现动作切换时自动重置
    session_key = f"{data.session_id}_{data.exercise}"

    # 如果该动作的探测器还没创建，则实例化它
    if session_key not in _sessions:
        detector_class = EXERCISE_MAP.get(data.exercise, SquatDetector)
        _sessions[session_key] = detector_class()
        print(f"Initialized {data.exercise} for session {data.session_id}")

    detector = _sessions[session_key]
    result = detector.process_frame(lm)

    # --- 4. 实时反馈 (Cues) 逻辑重构 ---
    cue = "Keep it up!"

    if data.exercise == "Squat":
        knee = result.get("metrics", {}).get("knee_angle", 180)
        if knee > 160: cue = "Brace core, begin descent"
        elif knee > 100: cue = f"Go lower — {knee:.0f}°"
        else: cue = "Great depth! Drive up"

    elif data.exercise == "Push-Up":
        # 俯卧撑实时提示
        if result.get("state") == "up":
            cue = "Lower your chest to the floor"
        else:
            cue = "Push back up strong!"

    elif data.exercise == "Forward Lunge":
        # 箭步蹲实时提示
        cue = "Keep your torso upright"
        if result.get("metrics", {}).get("knee_angle", 180) > 110:
            cue = "Step further and lower your back knee"

    elif data.exercise == "Plank":
        # 平板支撑显示计时
        duration = result.get("duration", 0)
        cue = f"Hold position! Time: {int(duration)}s"
        if result.get("form_issues"):
            cue = "Adjust your hip level!"

    return RealtimeResponse(
        detected_action=data.exercise,
        confidence=0.9, # 简化处理
        is_standard=not result.get("form_issues"),
        realtime_feedback=cue,
        reps=result.get("reps", 0),
        state=result.get("state", "up"),
        # 只有在 rep_completed 时才返回 form_issues，避免文字在屏幕上闪烁
        form_issues=result.get("form_issues", []) if result.get("rep_completed") else [],
        rep_completed=result.get("rep_completed", False),
    )

# --- 5. 总结与清理逻辑 ---

@app.post("/analyze-workout")
async def analyze_workout(data: WorkoutSummary) -> dict:
    # Clean up session detectors so the next session starts fresh
    prefix = f"{data.session_id}_"
    for k in [k for k in list(_sessions.keys()) if k.startswith(prefix)]:
        del _sessions[k]

    # Build a structured, data-driven mock coaching response.
    # Each section uses the actual session numbers so it reads as personalised
    # even without a real LLM call.

    # Section 1 — what they did well
    if data.rep_count >= 10:
        did_well = f"Excellent volume — {data.rep_count} reps of {data.exercise_name} in {data.duration_seconds}s shows real endurance."
    elif data.rep_count >= 5:
        did_well = f"Solid session: {data.rep_count} reps of {data.exercise_name} completed in {data.duration_seconds}s."
    else:
        did_well = f"Good start — {data.rep_count} reps of {data.exercise_name} in {data.duration_seconds}s. Every session builds the habit."

    # Section 2 — most important correction (drawn from detected issues)
    correction_map = {
        "Go deeper into your squat.": "Focus on depth — squatting to 90° knee angle fully activates the glutes and reduces shear force on the knee joint.",
        "Keep your chest up and avoid leaning forward.": "Brace your core and keep your torso more upright — excessive forward lean transfers load from your legs to your lower back.",
        "Drive your knees outward — avoid knee collapse.": "Push your knees out in line with your toes — letting them cave inward stresses the ACL and medial knee ligaments.",
        "Try to keep weight evenly distributed between both legs.": "Work on equal left/right loading — asymmetric squats overload one side and can lead to hip or knee imbalances over time.",
    }
    correction = "Maintain a steady tempo — control the descent for 2 seconds to build more muscle and protect your joints."
    for issue in data.issues:
        if issue in correction_map:
            correction = correction_map[issue]
            break

    # Section 3 — measurable next-session target
    next_target = f"Next session: aim for {data.rep_count + 2} reps with controlled 2-second descents."

    message = f"{did_well}\n\n{correction}\n\n{next_target}"

    return {
        "summary": {
            "exercise_type": data.exercise_name,
            "total_reps": data.rep_count,
            "valid_reps": data.valid_reps,
        },
        "ai_coaching": {"message": message},
    }


@app.get("/hello")
async def hello(): return {"message": "Hello from FastAPI"}