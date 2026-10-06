import json
import os
import urllib.request
from datetime import datetime, timezone

FEEDS = {
    "willow.json": "https://sonujson-v5.pages.dev/Data/willow.json",
    "fancode.json": "https://raw.githubusercontent.com/kajju027/Fancode-Events-Json/refs/heads/main/fancode.json",
    "world-sports.json": "https://matchdekho.in/api/world-sports.json",
}

OUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "api")
TIMEOUT = 25


def fetch(url):
    request = urllib.request.Request(url, headers={
        "User-Agent": "CnpTV-feed-sync/1.0",
        "Cache-Control": "no-cache",
        "Accept": "application/json,*/*",
    })
    with urllib.request.urlopen(request, timeout=TIMEOUT) as response:
        return response.read()


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    ok = 0
    for name, url in FEEDS.items():
        target = os.path.join(OUT_DIR, name)
        try:
            raw = fetch(url)
            data = json.loads(raw.decode("utf-8", "replace"))
            text = json.dumps(data, ensure_ascii=True, separators=(",", ":"))
            with open(target, "w", encoding="utf-8") as handle:
                handle.write(text)
            ok += 1
            print("saved api/" + name + " (" + str(len(text)) + " bytes)")
        except Exception as error:
            print("kept the previous api/" + name + " (fetch failed: " + str(error) + ")")

    stamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    with open(os.path.join(OUT_DIR, "last-sync.txt"), "w", encoding="utf-8") as handle:
        handle.write(stamp + " - " + str(ok) + "/" + str(len(FEEDS)) + " feeds refreshed\n")
    print("done at " + stamp)


if __name__ == "__main__":
    main()
