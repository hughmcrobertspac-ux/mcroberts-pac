# PAC letterhead

The PAC's letterhead in the site's own look: forest and ink, field green for labels, Striker gold only on dark, one 8° strike, and the site's three typefaces (`assets/fonts/`).

- `letterhead.css`: page geometry (Letter), the first-page masthead, the running head and folio from page two, and the minutes layout.
- `masthead.html`: the masthead every document shares. Each document has `{{masthead}}` where it goes.
- `minutes-YYYY-MM-DD.html`: the minutes of one meeting, word for word as the Secretary issued them. The PDF goes to `src/meetings/minutes/` and the Meetings page links it.
- `letterhead.html`: the blank letterhead.

Print every PDF with `python3 tools/letterhead/make.py` (or one: `make.py minutes-2026-10-14`), then run `python3 build.py` so `docs/` carries them.

`python3 tools/letterhead/make_docx.py` writes two Word files to `tools/letterhead/out/` (not committed): `mcroberts-pac-minutes-template.docx`, the minutes layout for the Secretary to fill in, and `mcroberts-pac-letterhead.docx`, for letters. Both use the standard library only. The masthead in them is a picture rendered from `masthead.html`, so it keeps the site's typefaces; the text is set in Aptos, Word's default face.

For a new meeting: copy the last `minutes-*.html`, replace the text, add the file to `DOCS` in `make.py`, print, and add a link under "Minutes by year" in `src/meetings/index.html`.
