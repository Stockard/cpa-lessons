from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import json
import os
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
user_progress = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    load_data()
    yield


app = FastAPI(title="CPA_PATH API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8081",
        "https://cpapath.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_cors_headers(request, call_next):
    response = await call_next(request)
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "*"
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
    global questions_data, chapters_data, user_progress

    with open(os.path.join(DATA_DIR, "question_bank.json"), "r", encoding="utf-8") as f:
        questions_data = json.load(f)

    chapters_data = load_chapters_list()

    progress_file = os.path.join(DATA_DIR, "user_progress", "user_001.json")
    if os.path.exists(progress_file):
        with open(progress_file, "r", encoding="utf-8") as f:
            user_progress = json.load(f)


def save_user_progress():
    progress_file = os.path.join(DATA_DIR, "user_progress", "user_001.json")
    with open(progress_file, "w", encoding="utf-8") as f:
        json.dump(user_progress, f, ensure_ascii=False, indent=2)


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
    chapter_id: Optional[str] = None,
    type: Optional[str] = None,
    difficulty: Optional[int] = None,
    wrong_only: Optional[bool] = None,
):
    questions = questions_data.get("questions", [])

    completed_lessons = set()
    lessons = user_progress.get("progress", {}).get("lessons", {})
    for lesson_id in lessons.keys():
        completed_lessons.add(lesson_id)

    if completed_lessons:
        questions = [
            q
            for q in questions
            if q.get("id", "").replace("ex_", "").rsplit("_", 1)[0] in completed_lessons
        ]

    if wrong_only:
        question_states = user_progress.get("progress", {}).get("question_states", {})
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


def recover_hearts():
    MAX_HEARTS = 5
    RECOVERY_MINUTES = 10

    last_recovery = user_progress["profile"].get("last_heart_recovery")
    current_hearts = user_progress["profile"].get("lives", 5)

    if current_hearts >= MAX_HEARTS:
        return current_hearts

    if last_recovery is None:
        user_progress["profile"]["lives"] = MAX_HEARTS
        user_progress["profile"]["last_heart_recovery"] = datetime.now().isoformat()
        return MAX_HEARTS

    last_recovery_time = datetime.fromisoformat(last_recovery)
    elapsed = datetime.now() - last_recovery_time
    minutes_elapsed = elapsed.total_seconds() / 60

    hearts_to_recover = int(minutes_elapsed / RECOVERY_MINUTES)
    new_hearts = min(MAX_HEARTS, current_hearts + hearts_to_recover)

    if new_hearts > current_hearts:
        user_progress["profile"]["lives"] = new_hearts
        user_progress["profile"]["last_heart_recovery"] = datetime.now().isoformat()

    return new_hearts


@app.get("/api/user/profile")
async def get_user_profile():
    recover_hearts()
    return user_progress.get("profile", {})


@app.get("/api/user/progress")
async def get_user_progress():
    return user_progress.get("progress", {})


@app.post("/api/user/lesson/complete")
async def complete_lesson(data: dict):
    lesson_id = data.get("lesson_id")
    score = data.get("score", 100)
    xp_earned = data.get("xp_earned", 20)

    if "lessons" not in user_progress["progress"]:
        user_progress["progress"]["lessons"] = {}

    if lesson_id not in user_progress["progress"]["lessons"]:
        user_progress["progress"]["lessons"][lesson_id] = {}

    user_progress["progress"]["lessons"][lesson_id].update(
        {
            "completed_at": datetime.now().isoformat(),
            "score": score,
            "xp_earned": xp_earned,
        }
    )

    user_progress["profile"]["xp"] += xp_earned
    user_progress["progress"]["statistics"]["total_xp_earned"] += xp_earned
    user_progress["progress"]["statistics"]["today_xp"] += xp_earned
    user_progress["progress"]["statistics"]["lessons_completed"] += 1

    today = datetime.now().strftime("%Y-%m-%d")
    yesterday = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")

    if today not in user_progress["progress"]["daily_activity"]:
        user_progress["progress"]["daily_activity"][today] = {
            "xp_earned": 0,
            "lessons_completed": 0,
            "questions_answered": 0,
            "streak_active": False,
        }
    user_progress["progress"]["daily_activity"][today]["xp_earned"] += xp_earned
    user_progress["progress"]["daily_activity"][today]["lessons_completed"] += 1

    if not user_progress["progress"]["daily_activity"][today].get(
        "streak_active", False
    ):
        user_progress["progress"]["daily_activity"][today]["streak_active"] = True

        last_active = user_progress["profile"].get("last_active_date")

        if last_active is None:
            user_progress["profile"]["streak"] = 1
        elif last_active == yesterday:
            user_progress["profile"]["streak"] = (
                user_progress["profile"].get("streak", 0) + 1
            )
        else:
            user_progress["profile"]["streak"] = 1

        user_progress["profile"]["last_active_date"] = today

    daily_lessons = user_progress["progress"]["daily_activity"][today][
        "lessons_completed"
    ]
    if daily_lessons > user_progress["progress"]["statistics"].get(
        "max_daily_lessons", 0
    ):
        user_progress["progress"]["statistics"]["max_daily_lessons"] = daily_lessons

    if score == 100:
        user_progress["progress"]["statistics"]["perfect_lessons"] = (
            user_progress["progress"]["statistics"].get("perfect_lessons", 0) + 1
        )

    current_streak = user_progress["profile"]["streak"]
    if current_streak > user_progress["progress"]["statistics"].get("max_streak", 0):
        user_progress["progress"]["statistics"]["max_streak"] = current_streak

    if "achievements" not in user_progress["progress"]:
        user_progress["progress"]["achievements"] = []

    save_user_progress()
    return {
        "success": True,
        "xp_earned": xp_earned,
        "total_xp": user_progress["profile"]["xp"],
        "streak": user_progress["profile"]["streak"],
    }


@app.post("/api/user/answer")
async def submit_answer(data: dict):
    recover_hearts()

    question_id = data.get("question_id")
    is_correct = data.get("is_correct", False)

    if "question_states" not in user_progress["progress"]:
        user_progress["progress"]["question_states"] = {}

    if question_id not in user_progress["progress"]["question_states"]:
        user_progress["progress"]["question_states"][question_id] = {
            "correct": 0,
            "wrong": 0,
        }

    if is_correct:
        user_progress["progress"]["question_states"][question_id]["correct"] += 1
        user_progress["profile"]["xp"] += 2
    else:
        user_progress["progress"]["question_states"][question_id]["wrong"] += 1
        user_progress["profile"]["lives"] = max(
            0, user_progress["profile"].get("lives", 5) - 1
        )

    user_progress["progress"]["statistics"]["total_questions_answered"] += 1
    if is_correct:
        user_progress["progress"]["statistics"]["total_correct_answers"] += 1

    today = datetime.now().strftime("%Y-%m-%d")
    yesterday = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")

    if today not in user_progress["progress"]["daily_activity"]:
        user_progress["progress"]["daily_activity"][today] = {
            "xp_earned": 0,
            "lessons_completed": 0,
            "questions_answered": 0,
            "streak_active": False,
        }
    user_progress["progress"]["daily_activity"][today]["questions_answered"] += 1
    if is_correct:
        user_progress["progress"]["daily_activity"][today]["xp_earned"] += 2

    if not user_progress["progress"]["daily_activity"][today].get(
        "streak_active", False
    ):
        user_progress["progress"]["daily_activity"][today]["streak_active"] = True

        last_active = user_progress["profile"].get("last_active_date")

        if last_active is None:
            user_progress["profile"]["streak"] = 1
        elif last_active == yesterday:
            user_progress["profile"]["streak"] = (
                user_progress["profile"].get("streak", 0) + 1
            )
        else:
            user_progress["profile"]["streak"] = 1

        user_progress["profile"]["last_active_date"] = today

    save_user_progress()
    return {
        "success": True,
        "lives": user_progress["profile"]["lives"],
        "xp": user_progress["profile"]["xp"],
    }


@app.post("/api/user/reset-progress")
async def reset_progress():
    user_progress["profile"]["xp"] = 0
    user_progress["profile"]["level"] = 1
    user_progress["profile"]["streak"] = 0
    user_progress["profile"]["lives"] = 5
    user_progress["profile"]["last_active_date"] = None
    user_progress["profile"]["last_heart_recovery"] = None
    user_progress["progress"]["lessons"] = {}
    user_progress["progress"]["question_states"] = {}
    user_progress["progress"]["achievements"] = []
    user_progress["progress"]["statistics"] = {
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
    save_user_progress()
    return {"success": True}


if __name__ == "__main__":
    import uvicorn
    import os

    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
