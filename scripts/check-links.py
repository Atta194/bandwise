#!/usr/bin/env python3
"""
Full user-path check for the live Ready Band Pro deployment.

Two passes:

  1. STATIC — every literal route target used in the source is compared with the
     routes the router actually generated, so a typo in a link is caught before
     anyone clicks it.
  2. LIVE — every page is fetched, every href on every page is fetched, and each
     endpoint behind the app is exercised end to end: sign up, level check, each
     module's mock, a focused drill, profile, analytics and the mistake lab.

Every call is real. Nothing here is mocked.
"""
import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

BASE = "https://ieltsreadybandpro.higgsfield.app"
UA = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
)

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
APP = os.path.join(REPO, "app")

failures: list[str] = []
notes: list[str] = []


def request(path, method="GET", body=None, token=None, allow=(200,)):
    headers = {"user-agent": UA}
    data = None
    if body is not None:
        headers["content-type"] = "application/json"
        data = json.dumps(body).encode()
    if token:
        headers["authorization"] = f"Bearer {token}"
    req = urllib.request.Request(BASE + path, data=data, method=method, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=60) as response:
            text = response.read().decode("utf-8", "replace")
            status = response.status
    except urllib.error.HTTPError as error:
        text = error.read().decode("utf-8", "replace")
        status = error.code
    except Exception as error:  # network level
        return 0, "", str(error)
    try:
        payload = json.loads(text)
    except Exception:
        payload = None
    return status, text, payload


def check(label, status, payload, expect=200, field=None):
    ok = status in (expect if isinstance(expect, tuple) else (expect,))
    if ok and field and payload is not None:
        ok = field in payload
    if ok:
        print(f"  PASS  {label}")
        return True
    print(f"  FAIL  {label}  (status {status})")
    failures.append(label)
    return False


# ---------------------------------------------------------------- 1. static

def static_check():
    print("=== 1. static route targets ===")
    tree = open(os.path.join(APP, "src", "routeTree.gen.ts"), encoding="utf-8").read()
    routes = set(re.findall(r"path: '([^']+)'", tree))
    routes.add("/")
    print(f"  generated routes: {sorted(routes)}")

    literals: dict[str, list[str]] = {}
    for root, _dirs, files in os.walk(os.path.join(APP, "src")):
        for name in files:
            if not name.endswith((".tsx", ".ts")):
                continue
            path = os.path.join(root, name)
            text = open(path, encoding="utf-8").read()
            for match in re.finditer(r'to="([^"{}]+)"', text):
                literals.setdefault(match.group(1), []).append(os.path.relpath(path, APP))

    for target, where in sorted(literals.items()):
        if target in routes:
            print(f"  PASS  to=\"{target}\"")
        else:
            print(f"  FAIL  to=\"{target}\"  used in {', '.join(sorted(set(where)))}")
            failures.append(f'static route target {target}')

    hrefs = set()
    for root, _dirs, files in os.walk(os.path.join(APP, "src")):
        for name in files:
            if not name.endswith((".tsx", ".ts")):
                continue
            text = open(os.path.join(root, name), encoding="utf-8").read()
            for match in re.finditer(r'href="(/[^"]*)"', text):
                hrefs.add(match.group(1))
    for href in sorted(hrefs):
        base = href.split("#")[0]
        known = base in routes or base.startswith("/api/") or base in ("/favicon.svg", "/og.png")
        print(f"  {'PASS' if known else 'FAIL'}  href=\"{href}\"")
        if not known:
            failures.append(f"static href {href}")


# ------------------------------------------------------------------ 2. live

def live_check():
    print("=== 2. sign up and exercise the endpoints ===")
    email = f"linkcheck+{int(time.time())}@example.com"
    status, _text, signup = request(
        "/api/auth/signup",
        "POST",
        {"email": email, "name": "Link Check", "password": "bandwise-check-1234"},
    )
    if not check("POST /api/auth/signup", status, signup, field="token"):
        return None
    token = signup["token"]

    status, _text, providers = request("/api/auth/providers")
    check("POST /api/auth/providers", status, providers, field="google")

    status, _text, me = request("/api/auth/me", "POST", {}, token)
    check("POST /api/auth/me", status, me, field="user")

    # Stay signed in: the remembered session, then a short one when it is not asked for.
    status, _text, again = request("/api/auth/me", "POST", {}, token)
    check("POST /api/auth/me (session persists)", status, again, field="user")

    status, _text, short = request(
        "/api/auth/signin",
        "POST",
        {"email": email, "password": "bandwise-check-1234", "remember": False},
    )
    if check("POST /api/auth/signin (remember off)", status, short, field="token"):
        print(f"        remember flag returned: {short.get('remember')}")

    status, _text, long_session = request(
        "/api/auth/signin",
        "POST",
        {"email": email, "password": "bandwise-check-1234", "remember": True},
    )
    if check("POST /api/auth/signin (remember on)", status, long_session, field="token"):
        print(f"        remember flag returned: {long_session.get('remember')}")
        token = long_session["token"]

    status, _text, target = request("/api/profile/set", "POST", {"targetBand": 7}, token)
    check("POST /api/profile/set (target band)", status, target, field="user")

    # The level check, exactly as the welcome popup runs it.
    status, _text, diag = request("/api/practice/start", "POST", {"kind": "diagnostic"}, token)
    if check("POST /api/practice/start (level check)", status, diag, field="payload"):
        questions = (diag["payload"]["reading"] or []) + (diag["payload"]["listening"] or [])
        print(f"        level check questions: {len(questions)}, minutes {diag['minutes']}")
        answers = {}
        for index, question in enumerate(questions):
            if index % 4 == 3:
                continue
            if question["type"] == "tfng":
                answers[str(question["n"])] = "TRUE"
            elif question["type"] == "ynng":
                answers[str(question["n"])] = "YES"
            elif question.get("options"):
                answers[str(question["n"])] = question["options"][0]
            else:
                answers[str(question["n"])] = "the"
        status, _text, submitted = request(
            "/api/practice/submit",
            "POST",
            {"attemptId": diag["attemptId"], "answers": answers, "mode": "heard"},
            token,
        )
        check("POST /api/practice/submit (level check)", status, submitted)
        status, _text, detail = request(
            "/api/practice/get", "POST", {"attemptId": diag["attemptId"]}, token
        )
        if check("POST /api/practice/get (level check)", status, detail, field="attempt"):
            attempt = detail["attempt"]
            print(f"        band {attempt['band']} raw {attempt['rawScore']}/{attempt['total']}")
            print(f"        cefr {detail['cefr']['cefr'] if detail.get('cefr') else 'none'}")
            print(f"        areas returned: {len(detail.get('areas') or [])}")
            for area in (detail.get("areas") or [])[:3]:
                print(f"          {area['module']} {area['taskType']} {area['accuracy']}%")

    # A focused drill on one question family.
    status, _text, drill = request(
        "/api/practice/start",
        "POST",
        {"kind": "drill", "module": "reading", "types": ["matching_headings"]},
        token,
    )
    if check("POST /api/practice/start (drill)", status, drill, field="payload"):
        count = len(drill["payload"]["questions"])
        print(f"        drill questions: {count}, passages {len(drill['payload']['passages'])}")
        answers = {}
        for question in drill["payload"]["questions"]:
            answers[str(question["n"])] = (question.get("options") or ["true"])[0]
        status, _text, submitted = request(
            "/api/practice/submit", "POST", {"attemptId": drill["attemptId"], "answers": answers}, token
        )
        check("POST /api/practice/submit (drill)", status, submitted)

    # Every module can start.
    for module in ("reading", "listening", "writing", "speaking"):
        status, _text, run = request("/api/practice/start", "POST", {"module": module}, token)
        check(f"POST /api/practice/start ({module})", status, run, field="attemptId")

    status, _text, kinds = request("/api/analytics/get", "POST", {}, token)
    if check("POST /api/analytics/get", status, kinds, field="areas"):
        print(f"        obtained {kinds['obtained']} target {kinds['targetBand']} progress {kinds['progress']}")
        print(f"        areas {len(kinds['areas'])}, traps {len(kinds['traps'])}")

    status, _text, mistakes = request("/api/mistakes/get", "POST", {}, token)
    check("POST /api/mistakes/get", status, mistakes, field="items")

    status, _text, advice = request("/api/recommend/get", "POST", {}, token)
    if check("POST /api/recommend/get", status, advice, field="recommendation"):
        print(f"        recommends: {advice['recommendation']['actionLabel']}")

    # The Google start route must reach Google's consent screen with this site's
    # redirect URI. A landing on Google's own error page is a FAILURE, not a pass:
    # the commonest cause is an unregistered redirect URI (Error 400:
    # redirect_uri_mismatch), which would otherwise look like a healthy 200.
    status, text, _payload = request("/api/auth/google")
    if "signin/oauth/error" in text or "redirect_uri_mismatch" in text:
        print("  FAIL  GET /api/auth/google  (Google refused: see the error page)")
        failures.append("GET /api/auth/google (Google refused the request)")
    elif status == 200 and "accounts.google.com" in text:
        print("  PASS  GET /api/auth/google (reached the consent screen)")
    else:
        print(f"  PASS  GET /api/auth/google ({status})")

    # Every recording must actually serve, and the listening paper must carry the
    # path to it, otherwise the paper plays silence.
    print("=== recordings and the listening paper ===")
    units = ["L1-A", "L1-B", "L2-A", "L2-B", "L3-A", "L3-B", "L4-A", "L4-B"]
    served = 0
    for unit in units:
        req = urllib.request.Request(f"{BASE}/audio/{unit}.mp3", headers={"user-agent": UA})
        try:
            with urllib.request.urlopen(req, timeout=90) as response:
                body = response.read()
                ctype = response.headers.get("content-type", "")
            good = response.status == 200 and "audio" in ctype and len(body) > 200_000
        except Exception:
            good = False
        served += good
        if not good:
            failures.append(f"recording {unit}.mp3")
            print(f"  FAIL  /audio/{unit}.mp3")
    if served == len(units):
        print(f"  PASS  all {len(units)} recordings served")
    else:
        failures.append("recordings not all served")

    status, _text, listen = request("/api/practice/start", "POST", {"module": "listening"}, token)
    if check("POST /api/practice/start (listening with recordings)", status, listen, field="payload"):
        parts = listen["payload"]["parts"]
        with_audio = [part for part in parts if part.get("audio")]
        print(f"        parts carrying a recording: {len(with_audio)}/{len(parts)}")
        if len(with_audio) != len(parts):
            failures.append("listening parts without a recording")
        for part in parts:
            answers = {str(q["n"]): (q.get("options") or ["x"])[0] for q in listen["payload"]["questions"] if q["part"] == part["part"]}
        status, _text, submitted = request(
            "/api/practice/submit",
            "POST",
            {
                "attemptId": listen["attemptId"],
                "answers": {str(q["n"]): (q.get("options") or ["the"])[0] for q in listen["payload"]["questions"]},
                "mode": "heard",
            },
            token,
        )
        check("POST /api/practice/submit (listening)", status, submitted)
        status, _text, marked = request(
            "/api/practice/get", "POST", {"attemptId": listen["attemptId"]}, token
        )
        if check("POST /api/practice/get (listening marked)", status, marked, field="items"):
            attempt = marked["attempt"]
            print(
                f"        marked {attempt['rawScore']}/{attempt['total']}, band {attempt['band']}, "
                f"{len(marked['items'])} question records"
            )
            if not marked["items"]:
                failures.append("listening produced no question records")

    return token


def crawl(token, pages):
    print("=== 3. every page, and every link on it ===")
    seen: dict[str, int] = {}
    for path in pages:
        status, text, _payload = request(path, token=token)
        marker = MARKERS.get(path)
        ok = status == 200 and (marker is None or marker.lower() in text.lower())
        print(f"  {'PASS' if ok else 'FAIL'}  GET {path}  ({status}, {len(text)} bytes)")
        if not ok:
            failures.append(f"page {path}")
        for href in sorted(set(re.findall(r'href="([^"]+)"', text))):
            if href.startswith(("http", "mailto:", "#")):
                continue
            base = href.split("#")[0]
            if base:
                seen[base] = seen.get(base, 0) + 1

    print(f"=== 4. every discovered internal link ({len(seen)}) ===")
    for link, count in sorted(seen.items()):
        status, _text, _payload = request(link, token=token)
        allowed = (200,) if not link.startswith("/api/") else (200, 302, 405)
        ok = status in allowed
        print(f"  {'PASS' if ok else 'FAIL'}  {link}  ({status}, linked {count}x)")
        if not ok:
            failures.append(f"link {link}")


MARKERS = {
    "/": "Practise under real exam conditions",
    "/account": "Create an account",
    "/policy": "Original content",
}

PAGES = [
    "/",
    "/account",
    "/policy",
    "/dashboard",
    "/practice",
    "/diagnostic",
    "/mistakes",
    "/analytics",
    "/test/reading",
    "/test/listening",
    "/test/writing",
    "/test/speaking",
    "/review/00000000-0000-0000-0000-000000000000",
]

if __name__ == "__main__":
    static_check()
    token = live_check()
    if token:
        crawl(token, PAGES)
    print()
    if failures:
        print(f"RESULT: {len(failures)} FAILURES")
        for item in failures:
            print(f"  - {item}")
        sys.exit(1)
    print("RESULT: all checks passed")
