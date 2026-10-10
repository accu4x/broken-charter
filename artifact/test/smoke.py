"""Headless smoke test of the built game: python artifact/test/smoke.py

Build first (node artifact/build.mjs). Needs Python Playwright with Chromium installed.
Checks, on a fresh save and with no page errors:
  1. an old v1 save migrates to v2 and keeps its gold and levels;
  2. every guild tab renders; hire, train a subclass, forge, brew, dispatch, post and pack work;
  3. a day rollover returns the dispatch and frees the post;
  4. a contract plays to its result screen on auto;
  5. a forced wipe kills the whole party and fills the Wall of the Fallen.
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

        v, gold, roster, lv, board = ev(page, """() => { const S = window.__bc.SAVE;
            return [S.v, S.gold, S.roster.length, S.roster[0].lv, S.board.length]; }""")
        check(v == 2 and gold == 900 and roster == 6 and lv == 3 and board >= 3, "v1 save migrates to v2")

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

        ev(page, "() => { localStorage.setItem('bc.dayshift', '1'); window.__bc.renderGuild(); }")
        check(ev(page, "() => window.__bc.SAVE.dispatch.length") == 0, "dispatch returns next day")
        check(ev(page, "() => window.__bc.SAVE.reports.length") >= 1, "return report written")
        tab(page, "posts")
        check(page.locator('[data-act="release"]').count() == 1, "post unlocks next day")

        tab(page, "hall")
        page.click('[data-act="embark"]')
        page.wait_for_timeout(250)
        check(play_out(page, 150) == "result", "a contract plays to its result on auto")
        page.click("#homeBtn")
        page.wait_for_timeout(200)

        tab(page, "hall")
        ev(page, "() => { window.__bc.SAVE.contract = 'thorn'; window.__bc.renderGuild(); }")
        sent = ev(page, "() => window.__bc.SAVE.party.length")
        fallen0 = ev(page, "() => window.__bc.SAVE.fallen.length")
        page.click('[data-act="embark"]')
        page.wait_for_timeout(200)
        ev(page, "() => { const R = window.__bc.RUN; for (const k in R.hp) R.hp[k] = 0.02; }")
        page.click(".node.open")
        ev(page, "() => { window.__bc.B.speed = 14; }")
        end = time.time() + 60
        while time.time() < end and screen(page) == "battle":
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
