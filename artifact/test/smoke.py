"""Headless smoke test of the built game: python artifact/test/smoke.py

Build first (node artifact/build.mjs). Needs Python Playwright with Chromium installed.
Checks, on a fresh save and with no page errors:
  1. an old v1 save migrates to v3 and keeps its gold and levels;
  2. every guild tab renders; hire, train a subclass, forge, brew, dispatch, post and pack work;
  3. a v2 save (real dates) migrates to v3 game days with its dispatch and post intact;
  4. Sleep returns the dispatch and frees the post;
  5. a reload mid-battle resumes that fight; a contract plays to its result on auto, and a second
     one waits for Sleep;
  6. the recruit board refreshes at the start of each five-day week;
  7. a forced wipe kills the whole party and fills the Wall of the Fallen.
Exit code 0 means every check passed.
"""
from __future__ import annotations

import json
import sys
import time
from pathlib import Path

from playwright.sync_api import Page, sync_playwright

DIST = Path(__file__).resolve().parents[1] / "dist" / "broken-charter.html"
OLD_SAVE = {
    "gold": 900, "done": 2, "wins": {"crypt": 2}, "heroes": {"brenna": {"lv": 3, "xp": 10}},
    "party": ["brenna", "sela", "orrin", "hilde", "grask"], "leader": "brenna", "contract": "crypt",
}

failures: list[str] = []


def check(cond: bool, what: str) -> None:
    print(("ok   " if cond else "FAIL ") + what)
    if not cond:
        failures.append(what)


def ev(page: Page, js: str, arg=None):
    return page.evaluate(js, arg)


def screen(page: Page) -> str:
    return ev(page, "() => [...document.querySelectorAll('section[data-screen]')].find(s => !s.hidden).dataset.screen")


def tab(page: Page, key: str) -> None:
    page.click(f'.tab[data-k="{key}"]')
    page.wait_for_timeout(120)


def sleep(page: Page) -> None:
    """Press Sleep, confirming when no contract was taken today."""
    page.click('#sleepRow [data-act="askSleep"], #sleepRow [data-act="sleep"]')
    if page.locator('#sleepRow [data-act="sleep"]').count():
        page.click('#sleepRow [data-act="sleep"]')
    page.wait_for_timeout(120)


def play_out(page: Page, limit_s: float) -> str:
    """Drive the map and events until the run reaches its result screen."""
    end = time.time() + limit_s
    while time.time() < end:
        s = screen(page)
        if s == "result":
            return s
        if s == "map":
            page.click(".node.open")
            ev(page, "() => { window.__bc.B.speed = 14; }")
            page.wait_for_timeout(150)
        elif s == "event":
            page.click(".choice")
            page.wait_for_timeout(120)
        else:
            page.wait_for_timeout(250)
    return screen(page)


def main() -> int:
    if not DIST.exists():
        print(f"missing {DIST}; run: node artifact/build.mjs")
        return 1
    errors: list[str] = []
    with sync_playwright() as pw:
        browser = pw.chromium.launch()
        page = browser.new_context(viewport={"width": 400, "height": 860}).new_page()
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.goto(DIST.as_uri())
        ev(page, """o => { localStorage.clear(); localStorage.setItem('bc.auto', 'true');
                     localStorage.setItem('bc.save', JSON.stringify(o)); }""", OLD_SAVE)
        page.reload()
        page.wait_for_timeout(900)

        v, day, gold, roster, lv, board = ev(page, """() => { const S = window.__bc.SAVE;
            return [S.v, S.day, S.gold, S.roster.length, S.roster[0].lv, S.board.length]; }""")
        check(v == 3 and day == 1 and gold == 900 and roster == 6 and lv == 3 and board >= 3, "v1 save migrates to v3")

        for key in ["hall", "roster", "recruit", "forge", "dispatch", "posts", "chapel"]:
            tab(page, key)
            check(page.locator("#panel").inner_text().strip() != "", f"tab renders: {key}")

        tab(page, "roster")
        page.click('[data-act="subFor"][data-uid="brenna"]')
        page.click('[data-act="sub"][data-uid="brenna"][data-k="paladin"]')
        check(ev(page, "() => window.__bc.heroById('brenna').sub") == "paladin", "subclass chosen at Lv 3")

        tab(page, "recruit")
        page.click('[data-act="hire"]')
        check(ev(page, "() => window.__bc.SAVE.roster.length") == 7, "hire a recruit")

        tab(page, "forge")
        page.click('[data-act="craftGear"][data-slot="weapon"]')
        page.click('[data-act="craftItem"][data-k="draught"]')
        check(ev(page, "() => window.__bc.heroById('brenna').gear.weapon") == 1, "forge a weapon")
        check(ev(page, "() => window.__bc.SAVE.items.draught") == 2, "brew a draught")

        tab(page, "dispatch")
        recruit = ev(page, "() => window.__bc.SAVE.roster[6].uid")
        page.select_option("#dMission", "gather:mire")
        page.select_option("#dHero", recruit)
        page.click('[data-act="dispatch"]')
        tab(page, "posts")
        page.select_option("#post_chaplain", "wren")
        page.click('[data-act="assign"][data-k="chaplain"]')
        states = ev(page, "u => [u, 'wren'].map(id => window.__bc.heroState(window.__bc.heroById(id)))", recruit)
        check(states == ["away", "posted"], "dispatch and post assignment")
        check(page.locator('[data-act="release"]').count() == 0, "a post locks for the day")

        tab(page, "hall")
        page.click('[data-act="pack"][data-k="draught"][data-d="1"]')
        check(json.loads(ev(page, "() => JSON.stringify(window.__bc.SAVE.pack)"))["draught"] == 2, "pack a draught")

        # Turn this save back into the v2 shape (device dates), then reload to migrate it.
        ev(page, """() => { const S = JSON.parse(localStorage.getItem('bc.save'));
            S.v = 2; delete S.day; delete S.contractDay; S.boardDay = '2026-10-09';
            S.dispatch.forEach(d => d.back = '2026-10-10');
            for (const k in S.posts) S.posts[k].until = '2026-10-10';
            localStorage.setItem('bc.save', JSON.stringify(S)); localStorage.setItem('bc.dayshift', '0'); }""")
        gold2 = ev(page, "() => window.__bc.SAVE.gold")
        page.reload()
        page.wait_for_timeout(900)
        m = ev(page, """() => { const S = window.__bc.SAVE; return { v: S.v, day: S.day, gold: S.gold,
            back: S.dispatch.map(d => d.back), until: S.posts.chaplain && S.posts.chaplain.until,
            roster: S.roster.length, shift: localStorage.getItem('bc.dayshift') }; }""")
        check(m == {"v": 3, "day": 1, "gold": gold2, "back": [2], "until": 2, "roster": 7, "shift": None},
              "v2 save migrates to v3 game days" + ("" if m.get("v") == 3 else f": {m}"))
        board0 = ev(page, "() => window.__bc.SAVE.board.map(c => c.uid).join()")

        sleep(page)
        check(ev(page, "() => window.__bc.SAVE.day") == 2, "Sleep starts day 2")
        check(ev(page, "() => window.__bc.SAVE.dispatch.length") == 0, "dispatch returns next day")
        check(ev(page, "() => window.__bc.SAVE.reports.length") >= 1, "return report written")
        tab(page, "posts")
        check(page.locator('[data-act="release"]').count() == 1, "post unlocks next day")

        tab(page, "hall")
        page.click('[data-act="embark"]')
        page.wait_for_timeout(250)
        page.click(".node.open")
        page.wait_for_timeout(300)
        page.reload()
        page.wait_for_timeout(900)
        r = ev(page, "() => { const R = window.__bc.RUN; return [R.active && R.active.join(), R.visited.length]; }")
        page.click("#resumeBtn")
        page.wait_for_timeout(250)
        check(r == ["0,0", 0] and screen(page) == "battle", "a reload mid-battle resumes the same fight" + ("" if r == ["0,0", 0] else f": {r}"))
        check(play_out(page, 150) == "result", "a contract plays to its result on auto")
        page.click("#homeBtn")
        page.wait_for_timeout(200)
        tab(page, "hall")
        check(page.locator('[data-act="embark"]').is_disabled(), "one contract per day")

        sleep(page)
        sleep(page)
        check(ev(page, "() => window.__bc.SAVE.board.map(c => c.uid).join()") == board0, "board holds on day 4")
        sleep(page)
        sleep(page)
        check(ev(page, "() => window.__bc.SAVE.board.map(c => c.uid).join()") != board0, "board refreshes on day 6")
        check("Week 2" in page.locator("#gDay").inner_text(), "day 6 starts week 2")
        check(page.locator('[data-act="embark"]').is_enabled(), "a new day allows a contract")

        tab(page, "hall")
        ev(page, "() => { window.__bc.SAVE.contract = 'thorn'; window.__bc.renderGuild(); }")
        sent = ev(page, "() => window.__bc.SAVE.party.length")
        fallen0 = ev(page, "() => window.__bc.SAVE.fallen.length")
        page.click('[data-act="embark"]')
        page.wait_for_timeout(200)
        # Near-dead heroes can still win a fight, so keep pressing on until the party falls.
        end = time.time() + 90
        while time.time() < end and screen(page) != "result":
            s = screen(page)
            if s == "map":
                ev(page, "() => { const R = window.__bc.RUN; for (const k in R.hp) if (R.hp[k] > 0) R.hp[k] = 0.02; }")
                page.click(".node.open")
                ev(page, "() => { window.__bc.B.speed = 14; }")
            elif s == "event":
                page.click(".choice")
            page.wait_for_timeout(250)
        wiped = "None returned" in page.locator("#resultPanel").inner_text()
        check(wiped, "a wipe ends the run")
        page.click("#homeBtn")
        page.wait_for_timeout(200)
        check(ev(page, "() => window.__bc.SAVE.fallen.length") == fallen0 + sent, "a wipe fills the Wall of the Fallen")

        browser.close()

    check(not errors, "no page errors" + ("" if not errors else ": " + " | ".join(errors[:3])))
    print(f"smoke: {'clean' if not failures else str(len(failures)) + ' failure(s)'}")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
