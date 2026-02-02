from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import json
import os
import uuid
from datetime import datetime, timedelta
from typing import Optional


def load_env():
    env_file = os.path.join(os.path.dirname(__file__), "..", "..", "data", ".env")
    if os.path.exists(env_file):
        with open(env_file, "r") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, value = line.split("=", 1)
                    os.environ[key.strip()] = value.strip()


load_env()

DATA_DIR = os.path.join(
    os.path.dirname(__file__), os.environ.get("DATA_DIR", "../data")
)
questions_data = {}
chapters_data = {}
user_progress_cache = {}
USER_COOKIE_NAME = "cpa_user_id"
USER_DATA_DIR = os.path.join(DATA_DIR, "user_progress")


def get_default_user_profile():
    return {
        "xp": 0,
        "level": 1,
        "streak": 0,
        "lives": 5,
        "last_active_date": None,
        "last_heart_recovery": None,
    }


def get_default_user_progress():
    return {
        "lessons": {},
        "question_states": {},
        "achievements": [],
        "statistics": {
            "total_questions_answered": 0,
            "total_correct_answers": 0,
            "total_xp_earned": 0,
            "today_xp": 0,
            "lessons_completed": 0,
            "chapters_completed": 0,
            "max_streak": 0,
            "max_daily_lessons": 0,
            "perfect_lessons": 0,
        },
        "daily_activity": {},
    }


def load_user_data(user_id):
    # Basic validation for visitor id - accept any non-empty string
    if not user_id or not isinstance(user_id, str) or len(user_id.strip()) == 0:
        user_id = str(uuid.uuid4())
    if user_id in user_progress_cache:
        return user_progress_cache[user_id]

    progress_file = os.path.join(USER_DATA_DIR, f"{user_id}.json")
    if os.path.exists(progress_file):
        try:
            with open(progress_file, "r", encoding="utf-8") as f:
                data = json.load(f)
        except Exception:
            data = {
                "profile": get_default_user_profile(),
                "progress": get_default_user_progress(),
            }
            user_progress_cache[user_id] = data
            save_user_data(user_id)
            return data
        user_progress_cache[user_id] = data
        return data

    data = {
        "profile": get_default_user_profile(),
        "progress": get_default_user_progress(),
    }
    user_progress_cache[user_id] = data
    return data


def save_user_data(user_id):
    if user_id not in user_progress_cache:
        return

    progress_file = os.path.join(USER_DATA_DIR, f"{user_id}.json")
    with open(progress_file, "w", encoding="utf-8") as f:
        json.dump(user_progress_cache[user_id], f, ensure_ascii=False, indent=2)


@asynccontextmanager
async def lifespan(app: FastAPI):
    load_data()
    yield


app = FastAPI(title="CPA_PATH API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8081",
        "http://localhost:8000",
        "https://*.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def user_identity_middleware(request: Request, call_next):
    if request.method == "OPTIONS":
        return await call_next(request)

    visitor_id = request.headers.get("X-CPA-Visitor")
    if not visitor_id:
        visitor_id = request.cookies.get(USER_COOKIE_NAME)
    new_user = False
    if (
        not visitor_id
        or not isinstance(visitor_id, str)
        or len(visitor_id.strip()) == 0
    ):
        visitor_id = str(uuid.uuid4())
        new_user = True
    user_data = load_user_data(visitor_id)
    request.state.user_id = visitor_id
    request.state.user_data = user_data
    response = await call_next(request)
    save_user_data(visitor_id)
    if new_user:
        response.headers["X-CPA-Visitor"] = visitor_id
    return response


def load_chapters_list():
    chapters = []
    for i in range(1, 31):
        chapter_dir = os.path.join(DATA_DIR, f"chapter_{i}")
        chapter_file = os.path.join(chapter_dir, "index.json")
        if os.path.exists(chapter_file):
            with open(chapter_file, "r", encoding="utf-8") as f:
                ch_data = json.load(f)
                ch = ch_data.get("chapter", {})
                lesson_files = [
                    f
                    for f in os.listdir(chapter_dir)
                    if f.startswith("lesson_") and f.endswith(".json")
                ]
                lessons_count = len(lesson_files)
                chapters.append(
                    {
                        "chapter_id": ch.get("chapter_id", str(i)),
                        "title": ch.get("title", f"Chapter {i}"),
                        "lessons_count": lessons_count,
                        "total_xp": ch.get("total_xp", 0),
                        "exam_weight": ch.get("exam_weight", "约1分"),
                        "difficulty": ch.get("difficulty", 1),
                    }
                )
    total_lessons = sum(ch.get("lessons_count", 0) for ch in chapters)
    total_xp = sum(ch.get("total_xp", 0) for ch in chapters)
    return {
        "course_info": {
            "title": "CPA注册会计师考试-会计科目",
            "total_chapters": len(chapters),
            "total_lessons": total_lessons,
            "total_xp": total_xp,
        },
        "chapters": chapters,
    }


def load_data():
    global questions_data, chapters_data

    with open(os.path.join(DATA_DIR, "question_bank.json"), "r", encoding="utf-8") as f:
        questions_data = json.load(f)

    chapters_data = load_chapters_list()


@app.get("/")
async def root():
    return {"message": "CPA_PATH API", "version": "1.0.0"}


@app.post("/api/admin/refresh-data")
async def refresh_data():
    """Reload data from disk into in-memory caches.
    Note: This will overwrite in-memory data with the on-disk state.
    Use for development when you modify files under backend/data.
    """
    try:
        load_data()
        return {"success": True, "message": "Data refreshed from disk"}
    except Exception as e:
        return JSONResponse({"success": False, "error": str(e)}, status_code=500)


@app.get("/api/admin/refresh-data")
async def refresh_data_get():
    try:
        load_data()
        return {"success": True, "message": "Data refreshed from disk (GET)"}
    except Exception as e:
        return JSONResponse({"success": False, "error": str(e)}, status_code=500)


@app.get("/api/chapters")
async def get_chapters():
    return chapters_data


@app.get("/api/chapters/{chapter_id}")
async def get_chapter(chapter_id: str):
    index_file = os.path.join(DATA_DIR, f"chapter_{chapter_id}", "index.json")
    if os.path.exists(index_file):
        with open(index_file, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"error": "Chapter not found"}


@app.get("/api/chapters/{chapter_id}/lessons/{lesson_id}")
async def get_lesson(chapter_id: str, lesson_id: str):
    lesson_file = os.path.join(
        DATA_DIR, f"chapter_{chapter_id}", f"lesson_{lesson_id}.json"
    )
    if os.path.exists(lesson_file):
        with open(lesson_file, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"error": "Lesson not found"}


import random


@app.get("/api/questions")
async def get_questions(
    request: Request,
    chapter_id: Optional[str] = None,
    type: Optional[str] = None,
    difficulty: Optional[int] = None,
    wrong_only: Optional[bool] = None,
    reviewed_only: Optional[bool] = False,
):
    questions = questions_data.get("questions", [])

    user_data = request.state.user_data
    completed_lessons = set()
    lessons = user_data.get("progress", {}).get("lessons", {})
    for lesson_id in lessons.keys():
        completed_lessons.add(lesson_id)

    if completed_lessons:
        questions = [
            q
            for q in questions
            if q.get("id", "").replace("ex_", "").rsplit("_", 1)[0] in completed_lessons
        ]

    if wrong_only:
        question_states = user_data.get("progress", {}).get("question_states", {})
        wrong_question_ids = [
            qid for qid, state in question_states.items() if state.get("wrong", 0) > 0
        ]
        questions = [q for q in questions if q.get("id") in wrong_question_ids]

    if chapter_id:
        questions = [q for q in questions if q.get("chapter_id") == chapter_id]
    if type:
        questions = [q for q in questions if q.get("type") == type]
    if difficulty:
        questions = [q for q in questions if q.get("difficulty") == difficulty]

    random.shuffle(questions)

    return {"questions": questions[:20], "total": len(questions)}


def recover_hearts(user_data):
    MAX_HEARTS = 5
    RECOVERY_MINUTES = 10

    last_recovery = user_data["profile"].get("last_heart_recovery")
    current_hearts = user_data["profile"].get("lives", 5)

    if current_hearts >= MAX_HEARTS:
        return current_hearts

    if last_recovery is None:
        user_data["profile"]["lives"] = MAX_HEARTS
        user_data["profile"]["last_heart_recovery"] = datetime.now().isoformat()
        return MAX_HEARTS

    last_recovery_time = datetime.fromisoformat(last_recovery)
    elapsed = datetime.now() - last_recovery_time
    minutes_elapsed = elapsed.total_seconds() / 60

    hearts_to_recover = int(minutes_elapsed / RECOVERY_MINUTES)
    new_hearts = min(MAX_HEARTS, current_hearts + hearts_to_recover)

    if new_hearts > current_hearts:
        user_data["profile"]["lives"] = new_hearts
        user_data["profile"]["last_heart_recovery"] = datetime.now().isoformat()

    return new_hearts


@app.get("/api/user/profile")
async def get_user_profile(request: Request):
    user_data = request.state.user_data
    recover_hearts(user_data)
    return user_data.get("profile", {})


@app.get("/api/user/progress")
async def get_user_progress(request: Request):
    user_data = request.state.user_data
    return user_data.get("progress", {})


@app.post("/api/user/lesson/complete")
async def complete_lesson(request: Request, data: dict):
    user_data = request.state.user_data
    user_id = request.state.user_id
    lesson_id = data.get("lesson_id")
    score = data.get("score", 100)
    xp_earned = data.get("xp_earned", 20)

    if "lessons" not in user_data["progress"]:
        user_data["progress"]["lessons"] = {}

    if lesson_id not in user_data["progress"]["lessons"]:
        user_data["progress"]["lessons"][lesson_id] = {}

    user_data["progress"]["lessons"][lesson_id].update(
        {
            "completed_at": datetime.now().isoformat(),
            "score": score,
            "xp_earned": xp_earned,
        }
    )

    user_data["profile"]["xp"] += xp_earned
    user_data["progress"]["statistics"]["total_xp_earned"] += xp_earned
    user_data["progress"]["statistics"]["today_xp"] += xp_earned
    user_data["progress"]["statistics"]["lessons_completed"] += 1

    today = datetime.now().strftime("%Y-%m-%d")
    yesterday = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")

    if today not in user_data["progress"]["daily_activity"]:
        user_data["progress"]["daily_activity"][today] = {
            "xp_earned": 0,
            "lessons_completed": 0,
            "questions_answered": 0,
            "streak_active": False,
        }
    user_data["progress"]["daily_activity"][today]["xp_earned"] += xp_earned
    user_data["progress"]["daily_activity"][today]["lessons_completed"] += 1

    if not user_data["progress"]["daily_activity"][today].get("streak_active", False):
        user_data["progress"]["daily_activity"][today]["streak_active"] = True

        last_active = user_data["profile"].get("last_active_date")

        if last_active is None:
            user_data["profile"]["streak"] = 1
        elif last_active == yesterday:
            user_data["profile"]["streak"] = user_data["profile"].get("streak", 0) + 1
        else:
            user_data["profile"]["streak"] = 1

        user_data["profile"]["last_active_date"] = today

    daily_lessons = user_data["progress"]["daily_activity"][today]["lessons_completed"]
    if daily_lessons > user_data["progress"]["statistics"].get("max_daily_lessons", 0):
        user_data["progress"]["statistics"]["max_daily_lessons"] = daily_lessons

    if score == 100:
        user_data["progress"]["statistics"]["perfect_lessons"] = (
            user_data["progress"]["statistics"].get("perfect_lessons", 0) + 1
        )

    current_streak = user_data["profile"]["streak"]
    if current_streak > user_data["progress"]["statistics"].get("max_streak", 0):
        user_data["progress"]["statistics"]["max_streak"] = current_streak

    if "achievements" not in user_data["progress"]:
        user_data["progress"]["achievements"] = []

    save_user_data(user_id)
    return {
        "success": True,
        "xp_earned": xp_earned,
        "total_xp": user_data["profile"]["xp"],
        "streak": user_data["profile"]["streak"],
    }


@app.post("/api/user/answer")
async def submit_answer(request: Request, data: dict):
    user_data = request.state.user_data
    user_id = request.state.user_id
    recover_hearts(user_data)

    question_id = data.get("question_id")
    is_correct = data.get("is_correct", False)

    if "question_states" not in user_data["progress"]:
        user_data["progress"]["question_states"] = {}

    if question_id not in user_data["progress"]["question_states"]:
        user_data["progress"]["question_states"][question_id] = {
            "correct": 0,
            "wrong": 0,
        }

    if is_correct:
        user_data["progress"]["question_states"][question_id]["correct"] += 1
        user_data["profile"]["xp"] += 2
    else:
        user_data["progress"]["question_states"][question_id]["wrong"] += 1
        user_data["profile"]["lives"] = max(0, user_data["profile"].get("lives", 5) - 1)

    user_data["progress"]["statistics"]["total_questions_answered"] += 1
    if is_correct:
        user_data["progress"]["statistics"]["total_correct_answers"] += 1

    today = datetime.now().strftime("%Y-%m-%d")
    yesterday = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")

    if today not in user_data["progress"]["daily_activity"]:
        user_data["progress"]["daily_activity"][today] = {
            "xp_earned": 0,
            "lessons_completed": 0,
            "questions_answered": 0,
            "streak_active": False,
        }
    user_data["progress"]["daily_activity"][today]["questions_answered"] += 1
    if is_correct:
        user_data["progress"]["daily_activity"][today]["xp_earned"] += 2

    if not user_data["progress"]["daily_activity"][today].get("streak_active", False):
        user_data["progress"]["daily_activity"][today]["streak_active"] = True

        last_active = user_data["profile"].get("last_active_date")

        if last_active is None:
            user_data["profile"]["streak"] = 1
        elif last_active == yesterday:
            user_data["profile"]["streak"] = user_data["profile"].get("streak", 0) + 1
        else:
            user_data["profile"]["streak"] = 1

        user_data["profile"]["last_active_date"] = today

    save_user_data(user_id)
    return {
        "success": True,
        "lives": user_data["profile"]["lives"],
        "xp": user_data["profile"]["xp"],
    }


@app.post("/api/user/reset-progress")
async def reset_progress(request: Request):
    user_data = request.state.user_data
    user_id = request.state.user_id
    user_data["profile"]["xp"] = 0
    user_data["profile"]["level"] = 1
    user_data["profile"]["streak"] = 0
    user_data["profile"]["lives"] = 5
    user_data["profile"]["last_active_date"] = None
    user_data["profile"]["last_heart_recovery"] = None
    user_data["progress"]["lessons"] = {}
    user_data["progress"]["question_states"] = {}
    user_data["progress"]["achievements"] = []
    user_data["progress"]["statistics"] = {
        "total_questions_answered": 0,
        "total_correct_answers": 0,
        "total_xp_earned": 0,
        "today_xp": 0,
        "lessons_completed": 0,
        "chapters_completed": 0,
        "max_streak": 0,
        "max_daily_lessons": 0,
        "perfect_lessons": 0,
    }
    save_user_data(user_id)
    return {"success": True}


if __name__ == "__main__":
    import uvicorn
    import os

    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
