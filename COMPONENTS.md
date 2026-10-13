# McRoberts PAC site: page authoring guide

Pages are HTML fragments in `src/`. `python3 build.py` wraps them in the shared layout (preview banner, header, footer) and writes `docs/`.

## 1. Every page starts with a JSON header (one line)

    <!--{"title": "Meetings", "description": "≤155 chars, plain English", "out": "meetings/index.html", "nav": "meetings"}-->

- `title`, `description`, `out` are required. `description` is 155 characters or fewer.
- `out`: path under docs/. Folder pages always end in `/index.html`.
- `nav`: `"home"` gives the page the site-name title, and `"home"` and `"meetings"` add the upcoming confirmed meetings to the page's JSON-LD. Other pages use their section name (about, money, contact and so on) or `""`; those values change nothing in the build.
- The menu: `NAV` in `build.py` is the one list that fills the header bar, the menu sheet and the footer (`{{nav_header}}`, `{{nav_sheet}}` and `{{nav_footer}}` in the partials). A new section is one `NAV` entry there. The current page is highlighted by its path, not by `nav`.
- Optional: `absoluteRoot: true` (makes `{{root}}` the site's base path, so the page works from any depth, as the 404 page does), `lang` (default `en`), `bodyClass`, `css` (stylesheets that sit beside the page, as `["report.css"]`), and `standalone: true` (a complete document of its own, written as it is without the layout or placeholders, like the financial report's print version).
- A page can keep its own files beside it in `src/` (scripts, data, a stylesheet, a PDF): the build publishes every file in `src/` that is not `.html` or `.md` at the same path. The site's Content-Security-Policy allows no inline script or style, so a page's script and style go in such files.
- The site is English only for now. Draft Chinese summaries are kept in `later/` and are not built. Other languages are added after the English site is final.

## 2. Placeholders

- `{{root}}` = relative path to the site root. Every internal link is relative: `href="{{root}}meetings/"`, `href="{{root}}about/#executive"`. Never start an internal link with `/`.
- `{{site.pacEmail}}` and any value from `data/site.json` by dot path, also inside the JSON header's `title` and `description`. Write the current school year as `{{site.schoolYear}}`; text about an earlier year stays typed.
- `{{phone_tel}}` (school phone as digits for `tel:` links), `{{meeting_time}}`, `{{meeting_place}}`, and `{{link:newsletter}}` (the URL of any link in `data/site.json` that has an `"id"`).
- Generated blocks (drop in as-is): `{{block:next_meeting}}` (dark scoreboard tile), `{{block:meetings_table}}` (all meetings of the school year with calendar links), `{{block:executive}}` (executive roles, with a name only for people who agreed to be named), `{{block:school_dates}}`, `{{block:last_year}}` (four stats; an item's `"tbc"` field gives it a TBC chip), `{{block:links_family}}`, `{{block:links_district}}`. The next meeting and the school dates list every future date with `data-date`; `assets/js/site.js` removes the dates that pass between builds.
- `<x-tbc>text</x-tbc>` or `<x-tbc tip="why">text</x-tbc>` marks a fact the PAC executive still has to confirm. In preview it renders with a dashed underline and a TBC chip. Use it for every fact the executive has not confirmed, and for money figures as the source rule in section 5 says. Leave out entirely anything the executive says must not be public.

## 3. Inner page skeleton (copy this)

```html
<section class="band page-head" aria-labelledby="page-h">
  <div class="wrap">
    <p class="eyebrow">Section label</p>
    <h1 id="page-h">Page title, short</h1>
    <p class="lead">One or two sentences.</p>
    <div class="in-short"><span class="in-short__tag">In short</span><p>The whole page in one or two plain sentences for families who read English as a second language.</p></div>
  </div>
</section>
<div class="wrap section layout layout--rail">
  <div class="prose">
    <h2 id="first">First section</h2>
    <p>…</p>
  </div>
  <nav class="rail" aria-label="On this page"><p class="eyebrow">On this page</p><ul role="list"><li><a href="#first">First section</a></li></ul></nav>
</div>
```
Wide components (tables, cards, exec list, link lists, yes/no) may sit inside `.prose` — they size themselves. If a page is short, drop `layout--rail` and the rail.

## 4. Components (class names already styled in assets/css/site.css)

- Buttons: `<a class="btn btn--action" href>` (primary on light), `btn--outline`, `btn--gold` (only on dark bands/tiles), `btn--ghost-light` (on dark), `btn--sm`. Group with `<div class="btn-row">`. A not-yet-available action: `<span class="btn btn--outline" aria-disabled="true">Donations: coming soon</span>`.
- Callout: `<div class="callout"><p>…</p></div>`; `callout callout--gold` for "important".
- Numbered steps: `<ol class="steps"><li><div><h3>Title</h3><p>…</p></div></li>…</ol>`
- Allowed / not allowed: `<div class="yesno"><div class="yes"><h3>Can pay for</h3><ul><li>…</li></ul></div><div class="no"><h3>Cannot pay for</h3><ul>…</ul></div></div>`
- Cards grid: `<div class="cards"><article class="card"><div class="card__meta"><span class="pill">About 2 hours</span></div><h3>…</h3><p>…</p><div class="btn-row">…</div></article></div>`
- Ledger table: `<div class="table-wrap"><table class="ledger"><caption class="vh">…</caption><thead><tr><th scope="col">…</th><th scope="col" class="num">Amount</th></tr></thead><tbody><tr><th scope="row">…</th><td class="num">$1,000</td></tr></tbody></table></div>` (money in `td.num`, mono font, right-aligned)
- Accordion (FAQ, long bylaws): `<details class="acc"><summary>Question?</summary><div class="acc__body"><p>…</p></div></details>`
- Noticeboard tiles (landing-style pages only): `<div class="board"><article class="tile tile--half">…</article></div>` (`tile--wide`, `tile--half`, `tile--full`, `tile--forest`, `tile--outline`).
- Money flow mini-diagram: see src/give/index.html (`.flow`).
- Big email: `<p class="big-email"><a href="mailto:{{site.pacEmail}}">{{site.pacEmail}}</a></p>` plus `<button class="copy-btn" type="button" data-copy="{{site.pacEmail}}">Copy address</button>`.
- Utility: `.eyebrow`, `.lead`, `.small`, `.muted`, `.mono`, `.pill`, `.vh` (visually hidden).
- Dates as text in `<time datetime="2026-10-14">Wednesday, October 14, 2026</time>`.

## 5. Writing rules

- Plain English, short sentences, common words (grade 8–9 reading level). Many parents read English as a second language. Say "the PAC" not "we the council". "Families", "parents and guardians".
- Voice: warm, factual, never salesy. No exclamation marks. No em-dash asides. No emoji. Sentence case headings (the display font uppercases nothing by itself; write "Where the money goes", not Title Case).
- Only facts from the PAC's own records (minutes, bylaws, bank and treasurer reports). If a fact is not confirmed, wrap it in `<x-tbc>`. If the executive says it must not be public, leave it out entirely.
- Money figures (the source rule, for this site and the financial report): a figure of the year the financial report covers has one home, `src/money/2025-26-report/data.js`, with the status and source `data.js` gives it. The site never types such a figure from memory or from a treasurer's report that `data.js` does not hold. On the other pages, a figure appears without a chip when `data.js` gives it as `confirmed` (the bank record) or as reported by the Treasurer. Any other figure (reported only in the minutes, derived, pending) goes in `<x-tbc>` with a tip that says why, or in the `"tbc"` field of a `"lastYear"` item. The report itself shows each figure's status with its own chips.
- Privacy (the naming and contact rule, for this site and the financial report): the only contact is {{site.pacEmail}}. No personal emails or phone numbers of anyone, volunteers included. No names of students, of parents who are not on the executive, or of teachers. An executive member or advisor is named only after that person has agreed to be named; a TBC chip never replaces that agreement, so until then show the role without the name. Executive names go only through `{{block:executive}}`.
- The PAC is independent of the school. For school business, point to the school office with `{{site.school.phone}}`, `{{site.school.email}}` and `{{site.school.url}}`, never typed values.
- External links: add `rel="noopener"`. Link text says where it goes.
- Accessibility: one h1 per page (the page-head), headings in order (h2, then h3), ids on every h2 the rail links to, no text in images, tables have a caption (can be `.vh`).
