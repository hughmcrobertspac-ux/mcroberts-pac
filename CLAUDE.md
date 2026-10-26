# McRoberts PAC website (public repo)

This repository is public (`hughmcrobertspac-ux/mcroberts-pac`, the PAC's own GitHub account, served on GitHub Pages), and so is its history. Treat everything you write here, including commit messages and commit author, as published.

## Never commit

- Anything that section 5 of `COMPONENTS.md` keeps off the site: personal contact details, the name of anyone who has not agreed to be named, and money figures that break its source rule. That section is the privacy and money-figure rule for the site and for the financial report in `src/money/2025-26-report/`.
- Your personal email address as commit author. Commit with your GitHub noreply address.
- Bank account or card numbers, passwords, tokens, login details.
- Private PAC correspondence, minutes drafts, bank statements or anything copied from the PAC Drive or from the assistant's private records.

## Where things come from

- Site content, privacy and money-figure rules: `COMPONENTS.md`. Upkeep steps: `HANDOVER.md`.
- The built site is `docs/`. Never edit it by hand: edit `src/`, `partials/`, `assets/` or `data/site.json` and run `python3 build.py`. `.claude/settings.json` denies edits to `docs/` and asks before every push, because a push publishes.
- What visitors read (everything in `src/`, `data/`, `partials/` and `docs/`) changes only when Ali has approved the change.

## The financial report

- `src/money/2025-26-report/data.js` is the one home of the report's figures and of each figure's status. Never change a real-world value without a source. Review notes, questions about the treasurers' figures and anything from private correspondence stay in the private working record, never here.
- The Treasurer reviewed the report on October 18, 2026. Set `meta.mode` to `"public"` only once the PAC executive has approved it too, and keep the e-Transfer address pending until the Treasurer confirms it.
- After any figure change, print the PDF again and run the check for figures typed outside `data.js` (HANDOVER.md, The financial report).
