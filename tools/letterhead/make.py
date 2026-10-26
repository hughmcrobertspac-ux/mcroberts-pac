#!/usr/bin/env python3
"""Print the PAC letterhead documents to PDF with headless Chrome.

    python3 tools/letterhead/make.py             # every document below
    python3 tools/letterhead/make.py minutes-2026-10-14

Each source HTML here carries {{masthead}}; this fills it from masthead.html,
prints Letter with no browser header or footer, and writes the PDF to the path
in DOCS. Run python3 build.py afterwards, so docs/ carries the new PDFs.
"""
import subprocess
import sys
import tempfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
DOCS = {
    "minutes-2026-09-16": ROOT / "src/meetings/minutes/2026-09-16-pac-meeting-minutes.pdf",
    "minutes-2026-10-14": ROOT / "src/meetings/minutes/2026-10-14-pac-meeting-minutes.pdf",
    "letterhead": HERE / "out/mcroberts-pac-letterhead.pdf",
}
CHROMES = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Google Chrome Beta.app/Contents/MacOS/Google Chrome Beta",
    "google-chrome", "chromium",
]


def chrome():
    for c in CHROMES:
        if "/" not in c or Path(c).exists():
            return c
    sys.exit("Google Chrome not found")


def render(name, out):
    html = (HERE / f"{name}.html").read_text().replace("{{masthead}}", (HERE / "masthead.html").read_text())
    out.parent.mkdir(parents=True, exist_ok=True)
    # The filled page sits next to its source so relative links to fonts and images resolve.
    with tempfile.NamedTemporaryFile("w", suffix=".html", dir=HERE, prefix=".print-", delete=False) as f:
        f.write(html)
        tmp = Path(f.name)
    try:
        subprocess.run([chrome(), "--headless=new", "--no-pdf-header-footer", "--virtual-time-budget=4000",
                        f"--print-to-pdf={out}", tmp.as_uri()], check=True, capture_output=True)
    finally:
        tmp.unlink()
    print(f"{out.relative_to(ROOT)}")


if __name__ == "__main__":
    for name in sys.argv[1:] or DOCS:
        render(name, DOCS[name])
