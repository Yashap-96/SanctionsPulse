"""Generate an AI intelligence summary from the daily diff using the Groq API."""

import json
import os
import pathlib
from datetime import date

PROJECT_ROOT = pathlib.Path(__file__).resolve().parent.parent
DIFF_DIR = PROJECT_ROOT / "data" / "diffs"
SUMMARY_DIR = PROJECT_ROOT / "data" / "summaries"

MODEL = "llama-3.3-70b-versatile"

SYSTEM_PROMPT = """\
You are a sanctions intelligence analyst. Given the daily OFAC sanctions list \
changes (additions, removals, and updates), produce a structured intelligence \
briefing as a valid JSON object.

IMPORTANT: Follow this EXACT JSON schema. Every field must match the specified type.

{
  "executive_summary": "string — 2-3 sentence high-level overview of the day's changes",
  "notable_entities": [
    {"uid": "string", "name": "string", "programs": ["string"], "significance": "string"}
  ],
  "risk_implications": [
    {"level": "HIGH or MEDIUM or LOW", "area": "string", "description": "string"}
  ],
  "program_highlights": [
    {"program": "string — program code", "daily_added": 0, "note": "string"}
  ],
  "geographic_hotspots": [
    {"region": "string", "countries": ["string — ISO2 codes"], "activity": "string", "trend": "Escalating or Steady or Declining"}
  ],
  "compliance_recommendations": ["string"]
}

Rules:
- risk_implications MUST be an array of objects, NEVER a string.
- notable_entities MUST be an array of objects, NEVER a string.
- program_highlights MUST be an array of objects, NEVER a string.
- geographic_hotspots MUST be an array of objects, NEVER a string.
- If there are no items for a field, use an empty array [].
- Respond ONLY with the JSON object. No markdown fencing, no commentary.\
"""


def generate_summary(diff: dict, summary_date: str | None = None) -> dict | None:
    """Call the Groq API to produce an AI summary of the daily diff.

    Returns the parsed summary dict, or None if no API key is configured.
    """
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        print("GROQ_API_KEY not set -- skipping AI summary generation.")
        return None

    # Import here so the module can be loaded without groq installed
    from groq import Groq

    summary_date = summary_date or date.today().isoformat()

    # Build a concise representation of the diff for the prompt
    prompt_data = {
        "date": diff.get("date"),
        "summary": diff.get("summary"),
        "additions": diff.get("additions", [])[:50],  # cap to keep prompt small
        "removals": diff.get("removals", [])[:50],
        "updates": diff.get("updates", [])[:50],
    }

    user_message = (
        f"Here are the OFAC sanctions list changes for {summary_date}:\n\n"
        f"{json.dumps(prompt_data, indent=2)}\n\n"
        "Produce the intelligence briefing JSON."
    )

    client = Groq(api_key=api_key)
    print(f"Calling Groq ({MODEL}) for AI summary ...")

    chat_completion = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_message},
        ],
        temperature=0.3,
        max_tokens=2048,
    )

    raw = chat_completion.choices[0].message.content.strip()

    # Strip markdown fencing if present
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[1]
    if raw.endswith("```"):
        raw = raw.rsplit("```", 1)[0]

    try:
        summary = json.loads(raw)
    except json.JSONDecodeError:
        print("Warning: Groq response was not valid JSON. Saving raw text.")
        summary = {"raw_response": raw}
        return summary

    # Post-process: ensure array fields are actually arrays
    array_fields = [
        "notable_entities",
        "risk_implications",
        "program_highlights",
        "geographic_hotspots",
        "compliance_recommendations",
    ]
    for field in array_fields:
        val = summary.get(field)
        if val is None:
            summary[field] = []
        elif isinstance(val, str):
            # Model returned a string instead of array — wrap it
            print(f"  Warning: '{field}' was a string, converting to array")
            summary[field] = [val] if val.strip() else []
        elif not isinstance(val, list):
            summary[field] = []

    return summary


def generate_and_save(diff: dict | None = None, summary_date: str | None = None) -> dict | None:
    """Generate summary and persist to disk."""
    summary_date = summary_date or date.today().isoformat()
    SUMMARY_DIR.mkdir(parents=True, exist_ok=True)

    if diff is None:
        diff_path = DIFF_DIR / f"daily_{summary_date}.json"
        if not diff_path.exists():
            print(f"No diff file found at {diff_path}")
            return None
        with open(diff_path) as f:
            diff = json.load(f)

    summary = generate_summary(diff, summary_date)
    if summary is None:
        return None

    out_path = SUMMARY_DIR / f"ai_summary_{summary_date}.json"
    with open(out_path, "w") as f:
        json.dump(summary, f, indent=2)
    print(f"AI summary saved to {out_path}")
    return summary


if __name__ == "__main__":
    generate_and_save()
