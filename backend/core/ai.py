import json
import os
import urllib.error
import urllib.request


def _fallback(data):
    goal = data["target"].strip()
    known = data.get("known_skills", [])
    level = data.get("current_level", "beginner")
    foundations = [
        ("Set your foundation", f"Map the essentials of {goal}", "Write down the core concepts and set up a small practice environment."),
        ("Practice the building blocks", f"Work through core {goal} skills", "Choose one focused exercise and explain the solution in your own words."),
        ("Build something real", f"Create a project with {goal}", "Ship a small, useful project and ask a peer to review it."),
        ("Reflect and level up", f"Share and refine your {goal} work", "Document what you learned, identify gaps, and plan the next iteration."),
    ]
    offset = 1 if level == "intermediate" else 2 if level == "advanced" else 0
    phases = []
    for index, (phase, title, description) in enumerate(foundations):
        if offset and index < offset:
            continue
        phases.append({
            "phase": phase,
            "title": title,
            "description": description + (f" Build on what you already know about {', '.join(known[:3])}." if known and index == 0 else ""),
            "project": ["A concept map and study log", "A set of solved practice challenges", f"A portfolio-ready {goal} project", "A short demo and reflection"][index],
            "prerequisites": known[:4],
            "estimated_hours": max(2, min(12, round(data["hours_per_week"] * data["target_weeks"] / max(1, len(foundations) - offset)))),
        })
    return phases


def generate_tasks(data):
    key = os.getenv("AI_API_KEY", "").strip()
    endpoint = os.getenv("AI_BASE_URL", "https://api.openai.com/v1/chat/completions")
    model = os.getenv("AI_MODEL", "gpt-4o-mini")
    if key:
        prompt = {
            "goal": data["target"], "level": data.get("current_level", "beginner"),
            "known_skills": data.get("known_skills", []), "hours_per_week": data["hours_per_week"],
            "weeks": data["target_weeks"], "style": data.get("learning_style", ""),
            "interests": data.get("areas_of_interest", []),
            "format": "Return only JSON: an array of 4-8 objects with phase, title, description, project, prerequisites (array), estimated_hours (integer). Recommendations should be realistic, beginner safe, and clearly framed as suggestions.",
        }
        req = urllib.request.Request(endpoint, data=json.dumps({
            "model": model, "temperature": 0.3,
            "messages": [{"role": "system", "content": "Create practical peer-learning roadmaps. Return valid JSON only."}, {"role": "user", "content": json.dumps(prompt)}],
        }).encode(), headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"}, method="POST")
        try:
            with urllib.request.urlopen(req, timeout=15) as response:
                raw = json.loads(response.read().decode())["choices"][0]["message"]["content"]
            start, end = raw.find("["), raw.rfind("]")
            tasks = json.loads(raw[start:end + 1])
            if not isinstance(tasks, list) or not 2 <= len(tasks) <= 12:
                raise ValueError("Unexpected task list")
            clean = []
            for item in tasks:
                if not isinstance(item, dict): raise ValueError("Invalid task")
                clean.append({
                    "phase": str(item.get("phase", "Learning phase"))[:80],
                    "title": str(item.get("title", "Practice a concept"))[:160],
                    "description": str(item.get("description", ""))[:500],
                    "project": str(item.get("project", ""))[:160],
                    "prerequisites": [str(x)[:80] for x in item.get("prerequisites", [])[:8]],
                    "estimated_hours": max(1, min(40, int(item.get("estimated_hours", 3)))),
                })
            return clean, "provider"
        except (urllib.error.URLError, TimeoutError, ValueError, KeyError, TypeError, json.JSONDecodeError):
            pass
    return _fallback(data), "fallback"
