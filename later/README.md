# later/

Pages that are not built. `build.py` only reads `src/`.

- `zh-hans/`, `zh-hant/`: draft Chinese summaries of the PAC. The site is English only until the English content is final.

To publish the drafts:

1. Build the language switch, which the site does not have: a language menu in `partials/header.html`, and page header fields read by `build.py` (for example `alt_en`, `alt_zh_hans` and `alt_zh_hant`) that link each page to its other languages, both in the menu and as `<link rel="alternate" hreflang>` tags.
2. Move the drafts into `src/`.
3. Check three things in each draft: the meeting date, time and place (typed in by hand; use `{{block:next_meeting}}` or `{{site.*}}` values), the styles in the draft's own `<style>` block (move them into `assets/css/site.css`, because the Content-Security-Policy in `partials/layout.html` blocks inline styles, and the site stylesheet already has the Chinese font rules), and that the draft still matches the English pages.
