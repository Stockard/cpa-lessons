#!/usr/bin/env python3
import json
import os
from pathlib import Path

DATA_DIR = Path(__file__).parent.parent / "data"
OUTPUT_FILE = DATA_DIR / "question_bank.json"


def normalize_question_type(qtype):
    """Normalize question types to consistent values"""
    if qtype == "multiple_choice":
        return "multi_choice"
    elif qtype == "judgment" or qtype == "true_false":
        return "judgment"
    return qtype


def process_lesson(lesson_file):
    """Extract exercises from a lesson file"""
    questions = []
    try:
        with open(lesson_file, "r", encoding="utf-8") as f:
            data = json.load(f)

        chapter_id = data.get("chapter_id", "")
        lesson_id = data.get("lesson_id", "")

        exercises = data.get("exercises", [])
        for exercise in exercises:
            q = {
                "id": exercise.get("id", ""),
                "type": normalize_question_type(exercise.get("type", "single_choice")),
                "difficulty": exercise.get("difficulty", 1),
                "chapter_id": chapter_id,
                "lesson_id": lesson_id,
                "question": exercise.get("question", ""),
                "options": exercise.get("options", []),
                "correct_answer": exercise.get("correct_answer", ""),
                "explanation": exercise.get("explanation", ""),
            }
            questions.append(q)

    except Exception as e:
        print(f"Error processing {lesson_file}: {e}")

    return questions


def main():
    all_questions = []

    # Process all 30 chapters
    for chapter_num in range(1, 31):
        chapter_dir = DATA_DIR / f"chapter_{chapter_num}"

        if not chapter_dir.exists():
            print(f"Warning: Chapter {chapter_num} directory not found")
            continue

        # Find all lesson files (lesson_*.json)
        lesson_files = sorted(chapter_dir.glob("lesson_*.json"))

        print(f"Chapter {chapter_num}: Found {len(lesson_files)} lesson files")

        for lesson_file in lesson_files:
            questions = process_lesson(lesson_file)
            all_questions.extend(questions)
            print(f"  - {lesson_file.name}: {len(questions)} questions")

    # Create question bank
    question_bank = {
        "total_questions": len(all_questions),
        "questions": all_questions,
    }

    # Write to file
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(question_bank, f, ensure_ascii=False, indent=2)

    print(f"\nGenerated {OUTPUT_FILE}")
    print(f"Total questions: {len(all_questions)}")

    # Print summary by chapter
    chapter_counts = {}
    for q in all_questions:
        ch = q.get("chapter_id", "unknown")
        chapter_counts[ch] = chapter_counts.get(ch, 0) + 1

    print("\nQuestions per chapter:")
    for ch in sorted(
        chapter_counts.keys(), key=lambda x: int(x) if x.isdigit() else 999
    ):
        print(f"  Chapter {ch}: {chapter_counts[ch]} questions")

    # Print summary by type
    type_counts = {}
    for q in all_questions:
        t = q.get("type", "unknown")
        type_counts[t] = type_counts.get(t, 0) + 1

    print("\nQuestions by type:")
    for t, count in sorted(type_counts.items()):
        print(f"  {t}: {count}")


if __name__ == "__main__":
    main()
