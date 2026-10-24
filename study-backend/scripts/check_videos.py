"""Checks every video ID in app/content/videos.py with YouTube's oEmbed endpoint.

Run from backend/:   python scripts/check_videos.py
  OK            public and embeddable
  NOT EMBEDDABLE owner disabled embedding (401)  -> replace it
  NOT FOUND     private or deleted (404)         -> replace it
  placeholder   youtube_id is None               -> add a real ID
Prints the real title and channel so you can confirm it matches the lesson.
"""
import json
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from app.content.videos import VIDEOS  # noqa: E402


def check(vid: str) -> str:
    url = "https://www.youtube.com/oembed?format=json&url=" + urllib.parse.quote(f"https://www.youtube.com/watch?v={vid}")
    try:
        with urllib.request.urlopen(url, timeout=10) as r:
            data = json.load(r)
        return f"OK  \"{data.get('title')}\" by {data.get('author_name')}"
    except urllib.error.HTTPError as e:
        return {401: "NOT EMBEDDABLE", 404: "NOT FOUND"}.get(e.code, f"HTTP {e.code}")
    except Exception as e:  # offline etc.
        return f"ERROR {e}"


bad = 0
for topic, lessons in VIDEOS.items():
    for v in lessons:
        if v["youtube_id"] is None:
            print(f"{v['id']:11} placeholder  (search: {v['search_query']})")
            bad += 1
            continue
        res = check(v["youtube_id"])
        bad += not res.startswith("OK")
        print(f"{v['id']:11} {v['youtube_id']}  {res}")
print(f"\n{bad} lesson(s) still need attention")
