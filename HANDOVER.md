# Keeping the PAC website up to date

The school year, meeting dates, links, school dates and last year's numbers live in `data/site.json`. Most of the words on the pages live in `src/`. After any change, run `python3 build.py` (Python 3.9 or newer), then commit and push `docs/` together with the change. GitHub Pages serves `docs/`.

## Change a meeting date
1. Open `data/site.json`, find `"meetings"`.
2. Change the date (format `2027-01-13`). Set `"status"` to `"confirmed"`, `"tbc"` or `"held"`.
3. Run `python3 build.py`, then commit and push.

The build rewrites the calendar files in `docs/meetings/`. Each meeting has a stable `"id"` in `data/site.json`; the calendar file name and event UID come from the id, not the date, so moving a meeting updates the same calendar event. When you move a date, add or raise `"sequence"` on that meeting by one (`"sequence": 1`), so calendar apps accept the change. Families who saved the single-meeting file keep the old date until they re-download it; the subscribe link on the Meetings page updates by itself. Give a new meeting a new unique `"id"` and never reuse one.

## After each meeting
Set that meeting's `"status"` to `"held"` and rebuild. Once its minutes are approved and on the site (`src/meetings/minutes/`, see `tools/letterhead/README.md`), add `"minutes": "meetings/minutes/<file>.pdf"` to the meeting: the table then shows a Minutes (PDF) link instead of "Held". A meeting or school date counts as upcoming while it is on or after today's date in Vancouver: the build drops past dates, and `assets/js/site.js` hides the ones that pass between builds in each visitor's browser, so the home page and the next-meeting tile stay current without a weekly rebuild. `"lastUpdated"` is only the date printed in the footer and as the "Last updated" date of the privacy notice and the accessibility statement: change it when you change content.

## New executive (every September)
1. Update `"executive"` in `data/site.json`: the roles, and a `"name"` only for a person who has agreed to be named (the naming rule is in `COMPONENTS.md`, section 5). Everyone else keeps `"name": ""`.
2. The advisors are typed into `src/about/index.html` by role (former Chair, former RDPA Representative). The same naming rule applies there.
3. Change the election date in the executive tile of the home page (`src/index.html`), in the executive section of `src/about/index.html` (`#executive`) and in the elections section of `src/meetings/index.html` (`#elections`).
4. Build, commit, push.

## Add a school date or a link
`"schoolDates"`, `"links.family"` and `"links.district"` in `data/site.json`.

## Leave preview (after the executive approves the site)
1. Every person named on the site has agreed to be named.
2. Resolve or remove every `<x-tbc>` item in `src/` and `partials/`. With preview off, the build stops and lists the ones that remain.
3. Meetings with status `"tbc"` look the same as confirmed ones once preview is off. Confirm them or reword the Meetings page first.
4. Remove the preview banner wording and review `partials/banner.html`, `partials/footer.html` and the privacy notice.
5. Move the site to the PAC's own GitHub account (see Accounts), then change `"baseUrl"` in `data/site.json` and the live link in `README.md` to the new address. The `og:image` address, the 404 page links and the calendar subscribe link follow `"baseUrl"`.
6. Set `"preview": false` in `data/site.json`. This removes the banner, the TBC chips and the `noindex` tag, and adds `<link rel="canonical">`, `sitemap.xml` and a Sitemap line in `robots.txt`. Crawlers read `robots.txt` only at the root of a host, so that file and its Sitemap line work only once the site has its own domain. On `github.io`, submit `sitemap.xml` in Google Search Console instead.
7. Build, commit, push.

## September refresh checklist
- New executive and meeting dates (see above).
- Change `"schoolYear"` in `data/site.json`. It fills the current year on the pages (`{{site.schoolYear}}`), the meetings table caption and the name of the calendar file with every meeting. Meeting ids and text about earlier years stay as typed. Find the year text that still needs a look with `git grep -nE '20[0-9]{2}–[0-9]{2}|Class of' -- src build.py data partials` (the Grad page, last year's figures, the news list).
- Last year's numbers on the home page (`"lastYear"`) and the yearly financial report follow the money-figure source rule in `COMPONENTS.md`, section 5. A new year's report is a copy of `src/money/2025-26-report/` under the new year's name, with its own `data.js`, a `NAV` entry in `build.py` and a link on the Money page.
- Links still working.
- `"lastUpdated"`, which also sets the "Last updated" dates of the privacy notice and the accessibility statement.

## The financial report
The 2025–26 report is in `src/money/2025-26-report/`. Its figures, each with a status (confirmed, reported, derived, pending) and a source, live only in `data.js`; the page copy and the print version read them from there (`PACViz.fillCopy` in `charts.js` fills each `data-fmt` element, and `derive()` at the end of `data.js` logs an error if an account or the two parts of the August 2026 cheque do not add up).
1. Change the figures in `data.js`, then look for any figure typed outside it: `grep -nE '\$[0-9]' src/money/2025-26-report/*.html src/money/2025-26-report/*.js | grep -v data.js` (the $50 slider default and the $100 square are part of the page).
2. Run `python3 build.py`, then print the PDF from the built copy, where the print page finds the site's fonts (Letter, no headers or footers):

   ```
   "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --no-pdf-header-footer --virtual-time-budget=6000 --print-to-pdf=src/money/2025-26-report/2025-26-financial-report.pdf docs/money/2025-26-report/print.html
   ```
3. Read the PDF's text with macOS's own PDFKit and check that the figures and the cover are there and that it has 7 pages:

   ```
   osascript -l JavaScript -e 'ObjC.import("PDFKit"); $.PDFDocument.alloc.initWithURL($.NSURL.fileURLWithPath("src/money/2025-26-report/2025-26-financial-report.pdf")).string.js'
   ```
4. Run `python3 build.py` again, so `docs/` carries the new PDF, then commit and push.

The two-page summary that the Money page links as the report is `summary.html`, read from the same `data.js`. Print it the same way, from `docs/money/2025-26-report/summary.html` to `src/money/2025-26-report/2025-26-financial-summary.pdf`, and check it stays on 2 pages.

The Treasurer reviewed the report on October 18, 2026; it keeps its review strip, notes and source chips until the PAC executive approves it too. For that version, set `meta.mode` to `"public"` in `data.js`: it hides the draft strip, the list of documents still awaited and the source chips on the page, but `data.js` still ships them and `print.html` always prints the draft edition, so check the page, the PDF text and `data.js` before calling it public. The e-Transfer address (`appeal.howToGive`) stays unconfirmed until the Treasurer confirms it takes donations: while its status is `pending`, the page and the PDF show a "coming soon" line instead of the address.

## Accounts
The site should belong to the PAC, not to one volunteer: a GitHub account on the PAC email with two executives able to recover it. The preview is hosted on a volunteer's personal GitHub account; transfer the repository to the PAC account before leaving preview (GitHub: Settings, Transfer ownership) and set up GitHub Pages again there. Any domain name is registered and paid by the PAC, with auto-renew on. Put the domain in `data/site.json` as `"domain"` and change `baseUrl`; `build.py` then writes `docs/CNAME` and every absolute link follows `baseUrl`.
