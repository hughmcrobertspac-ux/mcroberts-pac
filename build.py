#!/usr/bin/env python3
"""Build the McRoberts PAC site into docs/ (served by GitHub Pages).

    python3 build.py

Pages live in src/ as HTML fragments. Each starts with a JSON header in an
HTML comment:

    <!--{"title": "Meetings", "description": "...", "out": "meetings/index.html", "nav": "meetings"}-->
(an optional "absoluteRoot": true makes {{root}} the site's base path, for 404.html;
"css": ["report.css"] adds stylesheets that sit beside the page; "standalone": true
writes a complete document of its own as it is, without the layout, as the
financial report's print version is)

Any other file in src/ (a page's scripts, data, styles or PDF) is published at the
same path under docs/, so a page can keep its own files beside it.

Inside pages you can use:
    {{root}}                  relative path back to the site root ("", "../", ...)
    {{site.pacEmail}}         any value from data/site.json by dot path
    {{phone_tel}}             school phone as digits for tel: links
    {{meeting_time}}          usual meeting start time, e.g. 7:00 pm
    {{meeting_place}}         usual meeting place, e.g. School Library
    {{link:newsletter}}       URL of a link in data/site.json that has an "id"
    {{block:next_meeting}}    generated blocks (see BLOCKS below)
    <x-tbc>text</x-tbc>       a fact the PAC executive still has to confirm

Everything that changes during the year (meeting dates, executive, links)
lives in data/site.json, so a normal update is: edit the JSON, run this
script, commit. Python 3.9 or newer, standard library only (no tzdata needed).

    python3 build.py --today 2026-10-14    build as if it were that day (for testing)

"Today" decides which meetings and school dates still count as upcoming. It is
the real date in Vancouver, not data/site.json "lastUpdated", which is only the
date printed in the footer, the privacy notice, the accessibility statement and the
calendar files. The build lists every future date with a data-date attribute, and
assets/js/site.js removes the ones that pass between builds in the visitor's browser.
Rebuild after each meeting.
"""
import base64
import datetime as dt
import hashlib
import html
import json
import re
import os
import shutil
import sys
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent
SRC, PARTIALS, OUT = ROOT / "src", ROOT / "partials", ROOT / "docs"
SITE = json.loads((ROOT / "data" / "site.json").read_text(encoding="utf-8"))
PREVIEW = bool(SITE.get("preview"))
TZ = "America/Vancouver"
MONTHS = ["January", "February", "March", "April", "May", "June", "July",
          "August", "September", "October", "November", "December"]
DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]


def _nth_sunday(year, month, n):
    first = dt.date(year, month, 1)
    return first + dt.timedelta(days=(6 - first.weekday()) % 7 + 7 * (n - 1))


def vancouver_offset(naive_local):
    """UTC offset in hours (-7 or -8) for a Vancouver wall-clock time.

    Same rule as the VTIMEZONE below: daylight time runs from the second Sunday
    of March, 2:00, to the first Sunday of November, 2:00.
    """
    y = naive_local.year
    start = dt.datetime.combine(_nth_sunday(y, 3, 2), dt.time(2))
    end = dt.datetime.combine(_nth_sunday(y, 11, 1), dt.time(2))
    return -7 if start <= naive_local < end else -8


def vancouver_today():
    now = dt.datetime.now(dt.timezone.utc).replace(tzinfo=None)
    return (now + dt.timedelta(hours=vancouver_offset(now + dt.timedelta(hours=-8)))).date()


def _today_arg():
    if "--today" in sys.argv:
        return dt.date.fromisoformat(sys.argv[sys.argv.index("--today") + 1])
    return vancouver_today()


TODAY = _today_arg()  # real date: decides what is still upcoming
UPDATED = dt.date.fromisoformat(SITE.get("lastUpdated") or TODAY.isoformat())  # printed date only

esc = html.escape


def attr(v):
    """Escape for HTML text and double-quoted attribute values."""
    return html.escape(str(v), quote=False).replace('"', "&quot;")


def d(iso):
    return dt.date.fromisoformat(iso)


def long_date(day, weekday=True):
    s = f"{MONTHS[day.month - 1]} {day.day}, {day.year}"
    return f"{DAYS[day.weekday()]}, {s}" if weekday else s


def t12(hhmm):
    h, m = map(int, hhmm.split(":"))
    return f"{(h - 1) % 12 + 1}:{m:02d} {'am' if h < 12 else 'pm'}"


TBC_LEFT = []  # pages where a TBC marker was written while preview is off


def tbc(text, tip="To be confirmed by the PAC executive"):
    if not PREVIEW:
        TBC_LEFT.append(re.sub(r"<[^>]+>", "", text).strip() or tip)
        return text
    tip = attr(tip)
    return (f'<span class="tbc">{text}<span class="chip" title="{tip}" aria-hidden="true">TBC</span>'
            f'<span class="vh"> (to be confirmed: {tip})</span></span>')


def link_url(link_id):
    for group in SITE["links"].values():
        for l in group:
            if l.get("id") == link_id:
                return esc(l["url"])
    raise SystemExit(f"{{{{link:{link_id}}}}}: no link with that id in data/site.json")


def lookup(path):
    cur = SITE
    for part in path.split("."):
        cur = cur[int(part)] if isinstance(cur, list) else cur[part]
    return cur


def fill_site(text):
    """Replace {{site.x.y}} with the escaped value from data/site.json."""
    return re.sub(r"\{\{(site\.[a-zA-Z0-9_.]+)\}\}", lambda m: attr(lookup(m.group(1)[5:])), text)


def year_ics_name():
    """Calendar file with every meeting of the school year, e.g. pac-2026-27.ics."""
    return "pac-" + SITE["schoolYear"].replace("–", "-") + ".ics"


# ---------- generated blocks ----------
def upcoming_meetings():
    return [m for m in SITE["meetings"] if m["status"] != "held" and d(m["date"]) >= TODAY]


def meeting_ics_name(m):
    return f"pac-meeting-{m['id']}.ics"


def next_meeting_card(m, root, shown):
    md = SITE["meetingDefaults"]
    day = d(m["date"])
    when = f"{DAYS[day.weekday()]}, {MONTHS[day.month - 1]} {day.day}"
    date_html = when if m["status"] == "confirmed" else tbc(when)
    hidden = "" if shown else " hidden"
    return f'''<article class="scoreboard" aria-labelledby="next-meeting-h-{m['id']}" data-date="{m['date']}"{hidden}>
  <div class="scoreboard__date" aria-hidden="true"><span class="scoreboard__mon">{MONTHS[day.month - 1][:3]}</span><span class="scoreboard__day">{day.day}</span></div>
  <div class="scoreboard__body">
    <p class="eyebrow eyebrow--gold" aria-hidden="true">Next PAC meeting</p>
    <h2 id="next-meeting-h-{m['id']}" class="scoreboard__title"><span class="vh">Next PAC meeting: </span><time datetime="{m['date']}T{md['start']}">{date_html}</time></h2>
    <p class="scoreboard__meta"><span class="mono">{t12(md['start'])}</span> · {md['place']} or online</p>
    <p class="scoreboard__note">Everyone is welcome. You can just listen. {md['onlineNote']}</p>
    <div class="btn-row">
      <a class="btn btn--gold" href="{root}meetings/{meeting_ics_name(m)}">Add to my calendar</a>
      <a class="btn btn--ghost-light" href="mailto:{SITE['pacEmail']}?subject=Online%20link%20for%20the%20PAC%20meeting">Ask for the online link</a>
    </div>
  </div>
</article>'''


def block_next_meeting(root):
    # Every upcoming meeting is written out and only the first is shown, so that
    # site.js can show the next one once a date has passed without a rebuild.
    ms = upcoming_meetings()
    if not ms:
        return ""
    cards = "\n".join(next_meeting_card(m, root, i == 0) for i, m in enumerate(ms))
    return f'<div class="upcoming" data-upcoming="1">\n{cards}\n</div>'


def webcal_url(path):
    """Subscribe link: calendar apps poll a webcal:// feed, so a moved date updates by itself."""
    return re.sub(r"^https?://", "webcal://", SITE["baseUrl"]) + path


def block_meetings_table(root):
    md = SITE["meetingDefaults"]
    rows = []
    for m in SITE["meetings"]:
        day = d(m["date"])
        label = long_date(day)
        if m["status"] == "held":
            # A held meeting links its minutes once they are on the site; until then it just says Held.
            status = "" if m.get("minutes") else '<span class="pill pill--done">Held</span>'
            cal = (f'<a class="link-cal" href="{root}{m["minutes"]}" download>Minutes (PDF)<span class="vh">: {label}</span></a>'
                   if m.get("minutes") else "")
        else:
            status = "" if m["status"] == "confirmed" else tbc("", "Date to be confirmed by the PAC executive").replace('<span class="tbc">', '<span class="tbc tbc--solo">')
            cal = f'<a class="link-cal" href="{root}meetings/{meeting_ics_name(m)}">Add to calendar<span class="vh">: {label}</span></a>'
        note = f'<span class="row-note">{esc(m["note"])}</span>' if m.get("note") else ""
        rows.append(f'<tr><th scope="row"><time datetime="{m["date"]}">{label}</time>{note}</th>'
                    f'<td class="mono">{t12(md["start"])}</td><td>{status}{cal}</td></tr>')
    return (f'<div class="table-wrap"><table class="ledger ledger--meetings"><caption class="vh">PAC meetings {SITE["schoolYear"]}</caption>'
            '<thead><tr><th scope="col">Date</th><th scope="col">Time</th><th scope="col"><span class="vh">Status and calendar</span></th></tr></thead>'
            f'<tbody>{"".join(rows)}</tbody></table></div>'
            f'<p class="small"><a href="{root}meetings/{year_ics_name()}">Add every meeting to your calendar</a> (one file, all dates), or <a href="{webcal_url("meetings/" + year_ics_name())}">subscribe</a> so your calendar picks up changed dates.</p>')


def block_executive(root):
    # A name is listed only after that person has agreed to be named (COMPONENTS.md, section 5).
    items = []
    for p in SITE["executive"]:
        role = esc(p["role"])
        if p["name"]:
            inner = f'<span class="exec__role">{role}</span><span class="exec__name">{esc(p["name"])}</span>'
        elif p.get("note"):
            inner = f'<span class="exec__role">{role}</span><span class="exec__name"><span class="muted">{esc(p["note"])}</span></span>'
        else:
            inner = f'<span class="exec__name">{role}</span>'
        items.append(f'<li class="exec">{inner}</li>')
    note = ""
    if any(not p["name"] and not p.get("note") for p in SITE["executive"]):
        note = '<p class="small">A name is shown here only after that person agrees to be listed.</p>'
    return f'<ul class="exec-list" role="list">{"".join(items)}</ul>{note}'


SCHOOL_DATES_SHOWN = 5


def block_school_dates(root):
    # Every future date is written out and the first five are shown; site.js drops
    # dates that pass between builds and shows the next ones.
    items = []
    for s in SITE["schoolDates"]:
        day = d(s["date"])
        if day < TODAY:
            continue
        closed = '<span class="pill">No school</span>' if s.get("closed") else ""
        hidden = "" if len(items) < SCHOOL_DATES_SHOWN else " hidden"
        items.append(f'<li data-date="{s["date"]}"{hidden}><time datetime="{s["date"]}" class="mono">{MONTHS[day.month - 1][:3]} {day.day}</time><span>{esc(s["label"])}</span>{closed}</li>')
    return f'<ul class="datelist" role="list" data-upcoming="{SCHOOL_DATES_SHOWN}">{"".join(items)}</ul>'


def block_last_year(root):
    ly = SITE["lastYear"]
    def fig(i):
        # "tbc": why the figure is not confirmed yet (money figures keep their status from data.js)
        return tbc(esc(i["figure"]), i["tbc"]) if i.get("tbc") else esc(i["figure"])
    cells = "".join(f'<li><span class="stat__fig">{fig(i)}</span><span class="stat__txt">{esc(i["text"])}</span></li>' for i in ly["items"])
    return f'<ul class="stats" role="list">{cells}</ul>'


def block_links(group):
    def f(root):
        items = "".join(
            f'<li><a href="{esc(l["url"])}" rel="noopener">{esc(l["label"])}<span class="ext" aria-hidden="true">↗</span></a><span class="small muted">{esc(l["note"])}</span></li>'
            for l in SITE["links"][group])
        return f'<ul class="linklist" role="list">{items}</ul>'
    return f


BLOCKS = {
    "next_meeting": block_next_meeting,
    "meetings_table": block_meetings_table,
    "executive": block_executive,
    "school_dates": block_school_dates,
    "last_year": block_last_year,
    "links_family": block_links("family"),
    "links_district": block_links("district"),
}


# ---------- calendar files ----------
def ics_text(v):
    return v.replace("\\", "\\\\").replace(";", "\\;").replace(",", "\\,").replace("\n", "\\n")


def ics_fold(line):
    out, cur = [], b""
    for ch in line:
        b = ch.encode("utf-8")
        if len(cur) + len(b) > (75 if not out else 74):
            out.append(cur.decode("utf-8"))
            cur = b""
        cur += b
    out.append(cur.decode("utf-8"))
    return "\r\n ".join(out)


def ics_event(m):
    md = SITE["meetingDefaults"]
    day = d(m["date"]).strftime("%Y%m%d")
    start, end = md["start"].replace(":", "") + "00", md["end"].replace(":", "") + "00"
    tentative = m["status"] != "confirmed"
    summary = "McRoberts PAC meeting" + (" (date to be confirmed)" if tentative else "")
    desc = "McRoberts PAC meeting. Everyone is welcome. " + md["onlineNote"] + " " + SITE["pacEmail"]
    if tentative:
        desc = "The PAC executive has not confirmed this date yet. Check the PAC website before you come. " + desc
    lines = [
        "BEGIN:VEVENT",
        f"UID:pac-{m['id']}@mcroberts-pac",
        f"SEQUENCE:{int(m.get('sequence', 0))}",
        f"DTSTAMP:{UPDATED.strftime('%Y%m%d')}T000000Z",
        f"DTSTART;TZID={TZ}:{day}T{start}",
        f"DTEND;TZID={TZ}:{day}T{end}",
        f"STATUS:{'TENTATIVE' if tentative else 'CONFIRMED'}",
        "SUMMARY:" + ics_text(summary),
        "LOCATION:" + ics_text(f"{md['place']}, {md['address']}"),
        "DESCRIPTION:" + ics_text(desc),
        "URL:" + SITE["baseUrl"] + "meetings/",
        "END:VEVENT"]
    return "\r\n".join(ics_fold(l) for l in lines)


VTZ = "\r\n".join([
    "BEGIN:VTIMEZONE", f"TZID:{TZ}",
    "BEGIN:DAYLIGHT", "TZOFFSETFROM:-0800", "TZOFFSETTO:-0700", "TZNAME:PDT", "DTSTART:19700308T020000", "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU", "END:DAYLIGHT",
    "BEGIN:STANDARD", "TZOFFSETFROM:-0700", "TZOFFSETTO:-0800", "TZNAME:PST", "DTSTART:19701101T020000", "RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU", "END:STANDARD",
    "END:VTIMEZONE"])


def ics(events):
    return "\r\n".join(["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//McRoberts PAC//Meetings//EN", "CALSCALE:GREGORIAN",
                        VTZ, *events, "END:VCALENDAR"]) + "\r\n"


def write_calendars(dest):
    out = dest / "meetings"
    out.mkdir(parents=True, exist_ok=True)
    upcoming = [m for m in SITE["meetings"] if m["status"] != "held"]
    for m in upcoming:
        (out / meeting_ics_name(m)).write_text(ics([ics_event(m)]), encoding="utf-8")
    (out / year_ics_name()).write_text(ics([ics_event(m) for m in upcoming]), encoding="utf-8")


def jsonld_org():
    return {"@context": "https://schema.org", "@type": "Organization", "name": SITE["orgName"],
            "alternateName": SITE["siteName"], "email": SITE["pacEmail"],
            "areaServed": "Richmond, British Columbia",
            "parentOrganization": {"@type": "School", "name": SITE["school"]["officialName"]}}


def iso_local(day, hhmm):
    h, mi = map(int, hhmm.split(":"))
    naive = dt.datetime(day.year, day.month, day.day, h, mi)
    return naive.replace(tzinfo=dt.timezone(dt.timedelta(hours=vancouver_offset(naive)))).isoformat()


def jsonld_events():
    md = SITE["meetingDefaults"]
    return [{"@context": "https://schema.org", "@type": "Event", "name": "McRoberts PAC meeting",
             "startDate": iso_local(d(m["date"]), md["start"]), "endDate": iso_local(d(m["date"]), md["end"]),
             "eventStatus": "https://schema.org/EventScheduled",
             "eventAttendanceMode": "https://schema.org/MixedEventAttendanceMode",
             "location": {"@type": "Place", "name": f"{md['place']}, {SITE['school']['name']}", "address": md["address"]},
             "organizer": {"@type": "Organization", "name": SITE["orgName"], "email": SITE["pacEmail"]}}
            for m in upcoming_meetings() if m["status"] == "confirmed"]


# ---------- navigation ----------
# One list feeds the header, the menu sheet and the footer. Each entry:
#   path   page folder under the site root ("" is the home page); "#x" adds an anchor
#   short  label in the header bar (omit to leave it out)
#   long   label in the menu sheet and footer
#   header / sheet / footer   which places show it (footer: column number, 0 = not shown)
NAV = [
    {"path": "",            "long": "Home",                "sheet": True},
    {"path": "about/",      "short": "About", "long": "About the PAC", "sheet": True, "footer": 1},
    {"path": "about/#executive", "long": "Executive", "footer": 1},
    {"path": "meetings/",   "short": "Meetings", "long": "Meetings", "sheet": True, "footer": 1},
    {"path": "money/",      "short": "Money", "long": "Where the money goes", "sheet": True, "footer": 1},
    {"path": "money/2025-26-report/", "long": "2025–26 financial report", "footer": 1},
    {"path": "wish-list/",  "long": "Teachers' Wish List", "sheet": True, "footer": 1},
    {"path": "grad/",       "long": "Dry After Grad",      "sheet": True, "footer": 1},
    {"path": "give/",       "long": "Ways to give",        "sheet": True, "footer": 2},
    {"path": "volunteer/",  "short": "Get involved", "long": "Get involved", "sheet": True, "footer": 2},
    {"path": "news/",       "long": "Get PAC news",        "sheet": True, "footer": 2},
    {"path": "resources/",  "short": "Resources", "long": "Resources", "sheet": True, "footer": 2},
    {"path": "faq/",        "long": "Questions",           "sheet": True, "footer": 2},
    {"path": "contact/",    "short": "Contact", "long": "Contact", "sheet": True, "footer": 2},
    {"path": "privacy/",    "long": "Privacy",             "footer": 3},
    {"path": "accessibility/", "long": "Accessibility",    "footer": 3},
]


def nav_item(e, label, root, out_rel, mark):
    here = mark and e["path"] == out_rel.replace("index.html", "")
    current = ' aria-current="page"' if here else ""
    return f'<li><a href="{root}{e["path"]}"{current}>{html.escape(label, quote=False)}</a></li>'


def nav_header(root, out_rel):
    return "\n        ".join(nav_item(e, e["short"], root, out_rel, True) for e in NAV if "short" in e)


def nav_sheet(root, out_rel):
    return "\n      ".join(nav_item(e, e["long"], root, out_rel, True) for e in NAV if e.get("sheet"))


def nav_footer(root, out_rel):
    cols = []
    for n in (1, 2, 3):
        items = "\n".join("        " + nav_item(e, e["long"], root, out_rel, False) for e in NAV if e.get("footer") == n)
        cols.append(f'      <ul role="list">\n{items}\n      </ul>')
    return "\n".join(cols)


# ---------- page assembly ----------
HEADER_RE = re.compile(r"^\s*<!--(\{.*?\})-->\s*", re.S)


def render(text, root, meta):
    text = re.sub(r"\{\{block:([a-z_]+)\}\}", lambda m: BLOCKS[m.group(1)](root), text)
    text = re.sub(r"<x-tbc(?: tip=\"([^\"]*)\")?>(.*?)</x-tbc>",
                  lambda m: tbc(m.group(2), m.group(1) or "To be confirmed by the PAC executive"), text, flags=re.S)
    text = text.replace("{{root}}", root)
    text = re.sub(r"\{\{link:([a-z0-9_-]+)\}\}", lambda m: link_url(m.group(1)), text)
    text = fill_site(text)
    for k, v in meta.items():
        if isinstance(v, str):
            text = text.replace("{{" + k + "}}", v)
    return text


def build():
    """Build into a scratch folder and swap it into docs/ only if everything worked."""
    tmp, old = ROOT / ".docs-build", ROOT / ".docs-old"
    for stale in (tmp, old):
        shutil.rmtree(stale, ignore_errors=True)
    try:
        n = build_into(tmp)
        if not PREVIEW and TBC_LEFT:
            raise SystemExit("preview is off but these <x-tbc> items are still in src/ or partials/ "
                             "(resolve or remove them first):\n  - " + "\n  - ".join(sorted(set(TBC_LEFT))))
        if OUT.exists():
            os.replace(OUT, old)
        os.replace(tmp, OUT)
        shutil.rmtree(old, ignore_errors=True)
    finally:
        shutil.rmtree(tmp, ignore_errors=True)
    print(f"built {n} pages into {OUT.relative_to(ROOT)}/ (preview={PREVIEW}, today={TODAY})")


def csp_policy(layout):
    """Content-Security-Policy for the <meta> tag. The one inline script (theme bootstrap) is allowed by hash,
    computed here so the policy never drifts from the script. frame-ancestors is not allowed in a <meta> policy, so
    it is left out (GitHub Pages cannot send headers)."""
    inline = re.findall(r"<script>(.*?)</script>", layout, re.S)
    hashes = " ".join("'sha256-" + base64.b64encode(hashlib.sha256(s.encode("utf-8")).digest()).decode() + "'" for s in inline)
    return ("default-src 'self'; script-src 'self' " + hashes + "; style-src 'self'; img-src 'self' data:; "
            "font-src 'self'; base-uri 'self'; form-action 'self'; object-src 'none'")


def copy_page_files(OUT):
    """Publish the files that sit beside pages in src/ (scripts, data, styles, PDFs) at the same path."""
    for f in sorted(SRC.rglob("*")):
        if f.is_file() and f.suffix not in (".html", ".md") and f.name != ".DS_Store":
            dest = OUT / f.relative_to(SRC)
            dest.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(f, dest)


def build_into(OUT):
    OUT.mkdir()
    shutil.copytree(ROOT / "assets", OUT / "assets")
    copy_page_files(OUT)
    (OUT / ".nojekyll").write_text("")
    if SITE.get("domain"):  # custom domain for GitHub Pages; build() recreates docs/, so it lives in site.json
        (OUT / "CNAME").write_text(SITE["domain"] + "\n")
    parts = {p.stem: p.read_text(encoding="utf-8") for p in PARTIALS.glob("*.html")}
    pages = sorted(SRC.glob("**/*.html"))
    listed = []  # pages for the sitemap
    for page in pages:
        raw = page.read_text(encoding="utf-8")
        hm = HEADER_RE.match(raw)
        if not hm:
            raise SystemExit(f"{page}: missing JSON header")
        meta = json.loads(hm.group(1))
        if meta.get("standalone"):  # a complete document of its own: no layout, no placeholders
            dest = OUT / meta["out"]
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_text(raw[hm.end():], encoding="utf-8")
            continue
        if page.name != "404.html":
            listed.append(page)
        for k in ("title", "description"):  # headers may use {{site.schoolYear}} and other site values
            meta[k] = html.unescape(fill_site(meta[k]))
        body = raw[hm.end():]
        out_rel = meta["out"]
        depth = out_rel.count("/")
        # absoluteRoot pages (404) can be served from any depth, so they link from the site's base path
        root = urlparse(SITE["baseUrl"]).path if meta.get("absoluteRoot") else "../" * depth
        nav = meta.get("nav", "")
        lang = meta.get("lang", "en")
        title = f"{meta['title']} · {SITE['siteName']}" if meta.get("nav") != "home" else f"{SITE['siteName']} · {SITE['school']['name']}"
        jsonld = [jsonld_org()] + (jsonld_events() if nav in ("home", "meetings") else [])
        fill = {
            "title": esc(title), "page_title": esc(meta["title"]), "description": esc(meta["description"]),
            "lang": lang, "csp": csp_policy(parts["layout"]), "root": root, "og_image": SITE["baseUrl"] + "assets/img/og.png", "canonical": SITE["baseUrl"] + out_rel.replace("index.html", ""),
            # preview pages are noindex, so they get a canonical link only once preview is off
            "canonical_link": "" if PREVIEW else f'<link rel="canonical" href="{SITE["baseUrl"] + out_rel.replace("index.html", "")}">',
            "robots": '<meta name="robots" content="noindex, nofollow">' if PREVIEW else "",
            "jsonld": "\n".join(f'<script type="application/ld+json">{json.dumps(j, ensure_ascii=False)}</script>' for j in jsonld),
            "banner": parts["banner"] if PREVIEW else "",
            "body_class": meta.get("bodyClass", ""),
            "page_css": "".join(f'<link rel="stylesheet" href="{attr(c)}">\n' for c in meta.get("css", [])),
            "preview_attr": ' data-preview="true"' if PREVIEW else "",
            "updated": long_date(UPDATED, weekday=False), "updated_iso": UPDATED.isoformat(),
            "phone_tel": re.sub(r"\D", "", SITE["school"]["phone"]),
            "meeting_time": t12(SITE["meetingDefaults"]["start"]),
            "meeting_place": SITE["meetingDefaults"]["place"],
        }
        fill["nav_header"], fill["nav_sheet"] = nav_header(root, out_rel), nav_sheet(root, out_rel)
        fill["nav_footer"] = nav_footer(root, out_rel)
        html_out = render(parts["layout"], root, fill)
        html_out = html_out.replace("<!--BANNER-->", render(fill["banner"], root, fill))
        html_out = html_out.replace("<!--HEADER-->", render(parts["header"], root, fill))
        html_out = html_out.replace("<!--FOOTER-->", render(parts["footer"], root, fill))
        html_out = html_out.replace("<!--MAIN-->", render(body, root, fill))
        dest = OUT / out_rel
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_text(html_out, encoding="utf-8")
    write_calendars(OUT)
    sitemap_urls = [SITE["baseUrl"] + p.relative_to(SRC).as_posix().replace("index.html", "") for p in listed]
    if PREVIEW:
        (OUT / "robots.txt").write_text("User-agent: *\nAllow: /\n")
    else:
        (OUT / "sitemap.xml").write_text(
            '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
            + "".join(f"  <url><loc>{esc(u)}</loc><lastmod>{UPDATED.isoformat()}</lastmod></url>\n" for u in sorted(sitemap_urls))
            + "</urlset>\n", encoding="utf-8")
        (OUT / "robots.txt").write_text(f"User-agent: *\nAllow: /\n\nSitemap: {SITE['baseUrl']}sitemap.xml\n")
    return len(pages)


if __name__ == "__main__":
    build()
