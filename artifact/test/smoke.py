"""Headless smoke test of the built game: python artifact/test/smoke.py

Build first (node artifact/build.mjs). Needs Python Playwright with Chromium installed.
Checks, on a fresh save and with no page errors:
  1. an old v1 save migrates to v3 and keeps its gold and levels; old sound and speed keys move
     into bc.settings;
  2. the hall draws, with eight stations, no sideways scroll at 400 px, and a sheet that opens and
     closes; every station's panel renders; hire, train a subclass, forge, brew, dispatch, post
     and pack work;
  3. a v2 save (real dates) migrates to v3 game days with its dispatch and post intact;
  4. Sleep returns the dispatch and frees the post;
  4b. the settings panel sets volume, light graphics and battle speed; a subclass waits for Lv 5;
  5. a slow first battle turns light graphics on, once, with a notice; light graphics toggled
     mid-battle skips the grain and bloom passes; a reload mid-battle resumes that fight; a contract plays to its result on auto, and a second
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
    "gold": 900, "done": 2, "wins": {"crypt": 2}, "heroes": {"brenna": {"lv": 5, "xp": 10}, "sela": {"lv": 4, "xp": 0}},
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
    """Open a station's panel (tapping the open one would close it)."""
    sel = f'.station[data-tab="{key}"]'
    if page.get_attribute(sel, "aria-expanded") != "true":
        page.click(sel)
    page.wait_for_timeout(120)


def sleep(page: Page) -> None:
    """Press Sleep, confirming when no contract was taken today."""
    page.click('#sleepRow [data-act="askSleep"], #sleepRow [data-act="sleep"]')
    page.wait_for_timeout(60)
    if page.locator('#sleepRow [data-act="cancel"]').count():
        page.click('#sleepRow [data-act="sleep"]')
    page.wait_for_timeout(1300)  # the fade to black and back, so the next Sleep is accepted


def ensure_battle(page: Page, limit_s: float = 30) -> bool:
    """Walk the map until a battle is on screen; False if the run ends first."""
    end = time.time() + limit_s
    while time.time() < end:
        s = screen(page)
        if s == "battle":
            return True
        if s == "result":
            return False
        page.click(".node.open" if s == "map" else ".choice")
        page.wait_for_timeout(250)
    return False


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
                     localStorage.setItem('bc.music', 'false'); localStorage.setItem('bc.speed', '2');
                     localStorage.setItem('bc.save', JSON.stringify(o)); }""", OLD_SAVE)
        page.reload()
        page.wait_for_timeout(900)

        v, day, gold, roster, lv, board = ev(page, """() => { const S = window.__bc.SAVE;
            return [S.v, S.day, S.gold, S.roster.length, S.roster[0].lv, S.board.length]; }""")
        check(v == 3 and day == 1 and gold == 900 and roster == 6 and lv == 5 and board >= 3, "v1 save migrates to v3")
        prefs = ev(page, """() => [window.__bc.PREFS.music, window.__bc.PREFS.speed, localStorage.getItem('bc.music'),
            localStorage.getItem('bc.speed'), !!localStorage.getItem('bc.settings')]""")
        check(prefs == [0, 2, None, None, True], "old sound and speed keys move into bc.settings" + ("" if prefs == [0, 2, None, None, True] else f": {prefs}"))

        check(page.locator(".station").count() == 8, "the hall has eight stations")
        lit = ev(page, """() => { const c = document.querySelector('#hallCv'); const d = c.getContext('2d')
            .getImageData(0, 0, c.width, c.height).data; let s = 0; for (let i = 0; i < d.length; i += 64) s += d[i] + d[i + 1];
            return s / (d.length / 64); }""")
        check(lit > 20, "the hall scene draws")
        check(ev(page, "() => document.documentElement.scrollWidth <= document.documentElement.clientWidth"),
              "no sideways scroll at 400 px")
        for key in ["hall", "roster", "recruit", "forge", "dispatch", "posts", "chapel"]:
            tab(page, key)
            check(page.locator("#panel").inner_text().strip() != "", f"station panel renders: {key}")
        page.click("#sheetClose")
        page.wait_for_timeout(100)
        closed = page.locator("#sheet").is_hidden()
        tab(page, "hall")
        page.click('.station[data-tab="hall"]')
        page.wait_for_timeout(100)
        check(closed and page.locator("#sheet").is_hidden(), "the sheet closes (Close, or its station again)")
        tab(page, "hall")
        page.keyboard.press("Escape")
        check(page.locator("#sheet").is_hidden(), "Escape closes the sheet")

        page.click("#settingsBtn")
        page.wait_for_timeout(120)
        check(page.locator("#sheetTitle").inner_text() == "Settings", "the settings panel opens")
        ev(page, """() => { const r = document.querySelector('#setMusic'); r.value = 50; r.dispatchEvent(new Event('input', { bubbles: true })); }""")
        page.click('[data-act="speed"][data-k="3"]')
        page.click('[data-act="light"]')
        st = ev(page, "() => { const P = window.__bc.PREFS; return [P.music, P.speed, P.light, JSON.parse(localStorage.getItem('bc.settings')).speed]; }")
        check(st == [0.5, 3, True, 3], "settings set volume, battle speed and light graphics" + ("" if st == [0.5, 3, True, 3] else f": {st}"))
        page.click('[data-act="light"]')
        page.click("#settingsBtn")
        check(page.locator("#sheet").is_hidden() and not ev(page, "() => window.__bc.PREFS.light"), "settings close; light graphics back off")

        tab(page, "roster")
        check(page.locator('[data-act="subFor"][data-uid="sela"]').count() == 0, "no subclass before Lv 5")
        gold0 = ev(page, "() => window.__bc.SAVE.gold")
        page.click('[data-act="subFor"][data-uid="brenna"]')
        page.click('[data-act="sub"][data-uid="brenna"][data-k="paladin"]')
        paid = gold0 - ev(page, "() => window.__bc.SAVE.gold")
        check(ev(page, "() => window.__bc.heroById('brenna').sub") == "paladin" and paid == 100,
              "subclass chosen at Lv 5, for 100 gold" + ("" if paid == 100 else f": paid {paid}"))

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

        # A slow first battle (the CPU slowed 8x) turns light graphics on, once, and says so.
        cdp = page.context.new_cdp_session(page)
        cdp.send("Emulation.setCPUThrottlingRate", {"rate": 8})
        end = time.time() + 20
        while time.time() < end and not ev(page, "() => window.__bc.PREFS.lightChecked"):
            page.wait_for_timeout(250)
        cdp.send("Emulation.setCPUThrottlingRate", {"rate": 1})
        check(ev(page, "() => window.__bc.PREFS.light") and page.locator("#toast").is_visible(),
              "a slow first battle turns light graphics on, with a notice")
        # Hold a battle open (time slowed 20x) while light graphics goes on and off.
        in_battle = ensure_battle(page)
        ev(page, "() => { window.__bc.B.speed = 0.05; window.__bc.PREFS.light = true; }")
        page.wait_for_timeout(300)
        lite, held1 = ev(page, "() => window.__bc.B.passes"), screen(page) == "battle"
        ev(page, "() => { window.__bc.PREFS.light = false; }")
        page.wait_for_timeout(300)
        full, held2 = ev(page, "() => window.__bc.B.passes"), screen(page) == "battle"
        ev(page, "() => { window.__bc.B.speed = 14; }")
        ok = in_battle and held1 and held2 and not lite["grain"] and not lite["bloom"] and full["grain"] and full["bloom"]
        check(ok, "light graphics mid-battle skips the grain and bloom passes" + ("" if ok else f": {in_battle} {held1} {held2} {lite} / {full}"))
        check(play_out(page, 150) == "result", "a contract plays to its result on auto")
        page.click("#homeBtn")
        page.wait_for_timeout(200)
        tab(page, "hall")
        check(page.locator('[data-act="embark"]').is_disabled(), "one contract per day")

        day = ev(page, "() => window.__bc.SAVE.day")
        page.click('.station[data-k="stairs"]')
        page.wait_for_timeout(120)
        check(ev(page, "() => window.__bc.SAVE.day") == day + 1, "the stairs sleep once the day's contract is taken")
        page.click('.station[data-k="stairs"]')
        check(ev(page, "() => window.__bc.SAVE.day") == day + 1, "a second tap during the fade doesn't sleep again")
        page.wait_for_timeout(1300)
        sleep(page)
        board = "() => window.__bc.SAVE.board.map(c => c.uid).join()"
        check(ev(page, board) == board0, "board holds on day 4")
        # A hall upgrade rerolls the board at once, without moving the next weekly refresh.
        ev(page, "() => { const M = window.__bc.SAVE.mats; M.bone = M.scrap = M.scale = 5; window.__bc.renderGuild(); }")
        tab(page, "recruit")
        page.click('[data-act="upgrade"][data-k="hall"]')
        board1 = ev(page, board)
        check(board1 != board0 and ev(page, "() => window.__bc.SAVE.build.hall") == 2, "a hall upgrade rerolls the board")
        sleep(page)
        sleep(page)
        check(ev(page, board) != board1, "board still refreshes on day 6")
        check("Week 2" in page.locator("#gDay").inner_text(), "day 6 starts week 2")
        tab(page, "hall")
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
