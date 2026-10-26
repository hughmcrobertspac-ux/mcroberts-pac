# McRoberts PAC website

The website of the Parent Advisory Council of Hugh McRoberts Secondary, Richmond, BC.

**Status: live.** Preview mode is off; pages carry a canonical link and a sitemap, and no preview banner or TBC chips are shown.

- Live site: https://hughmcrobertspac-ux.github.io/mcroberts-pac/ (mcroberts.richmond-dpac.ca is being pointed to this GitHub Pages site)
- Contact: hughmcrobertspac@gmail.com

## How it works

Plain HTML and CSS, one small JavaScript file, and a build script that uses only the Python standard library (Python 3.9 or newer).

```
data/site.json     what changes during the year (school year, meetings, executive, links, school dates, preview switch)
src/               one HTML fragment per page, with any files of its own beside it
partials/          shared layout, preview banner, header, footer
assets/            CSS, JS, self-hosted fonts, icons
tools/             HTML sources of the social image and the touch icon (see below)
later/             draft pages that are not built (Chinese summaries)
build.py           stitches it together into docs/ and writes the calendar files
docs/              the built site that GitHub Pages serves (commit it)
COMPONENTS.md      how to write a page
HANDOVER.md        how to keep the site up to date
CLAUDE.md          rules for AI assistants working in this public repo
```

The yearly financial report lives in `src/money/2025-26-report/` (published at `money/2025-26-report/`): `data.js` holds its figures, `report.js`, `charts.js`, `scrolly.js` and `give-explorer.js` draw the page, `report.css` styles it on the site's tokens, and `print.html` is the Letter print version the PDF beside it is printed from. HANDOVER.md has the update steps.

```
python3 build.py                       build into docs/
python3 build.py --today 2026-10-14    build as if it were another day
```

The build writes to a scratch folder and replaces `docs/` only when it succeeds. Which meetings and school dates count as upcoming depends on the real date: the build drops past dates, and `assets/js/site.js` hides the ones that pass between builds. Rebuild after each meeting (see HANDOVER.md).

## Where facts come from

The PAC's own records: meeting minutes, the bylaws, bank and treasurer reports. Money figures follow the source rule in [COMPONENTS.md, section 5](COMPONENTS.md#5-writing-rules): they come from `src/money/2025-26-report/data.js` and keep its status. Nothing from private family or PAC correspondence belongs in this repo.

## Images

`assets/img/og.png` (social preview, 1200 by 630) and `assets/img/touch-icon.png` (180 by 180) are screenshots of `tools/og.html` and `tools/touch.html` at exactly those sizes, taken in a desktop browser. `assets/img/mark.svg` is the mark itself. The mark in `tools/og.html` uses a lighter green (`#24502A`), because the card behind it is already `#1B3C1F`.

No cookies, no analytics, no third-party requests. Fonts (Big Shoulders, Atkinson Hyperlegible Next and Mono) are self-hosted under the SIL Open Font License; the licence texts are in `assets/fonts/OFL-*.txt` and ship with the site.
