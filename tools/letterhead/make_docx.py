#!/usr/bin/env python3
"""Build the PAC letterhead as Word templates, with the Python standard library only.

    python3 tools/letterhead/make_docx.py

Writes to tools/letterhead/out/:
  mcroberts-pac-letterhead.docx         a blank page on the letterhead, for letters
  mcroberts-pac-minutes-template.docx   the minutes layout, ready for the Secretary to fill in

The masthead and the running wordmark are pictures rendered from masthead.html with
headless Chrome, so they keep the site's own typefaces on any computer. The text uses
Aptos (Word's default face), and Word falls back to Calibri where Aptos is missing.
"""
import subprocess
import zipfile
from pathlib import Path
from xml.sax.saxutils import escape

from make import HERE, chrome

OUT = HERE / "out"
EMU = 914400  # per inch
FOREST, INK, TEXT, MUTED, ACTION, GOLD, LINE = "1B3C1F", "08120D", "101814", "46504A", "167D4C", "F8B11B", "CBD8D0"
FONT = "Aptos"

NS = ('xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" '
      'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" '
      'xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" '
      'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" '
      'xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"')
XML = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'


def shoot(body_html, css, size, scale, out):
    """Screenshot a fragment of the letterhead at print resolution."""
    page = HERE / ".shot.html"
    page.write_text(f'<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="letterhead.css">'
                    f'<style>html,body{{margin:0;background:#fff}}{css}</style></head><body>{body_html}</body></html>')
    try:
        subprocess.run([chrome(), "--headless=new", "--hide-scrollbars", f"--force-device-scale-factor={scale}",
                        f"--window-size={size[0]},{size[1]}", "--virtual-time-budget=3000",
                        f"--screenshot={out}", page.as_uri()], check=True, capture_output=True)
    finally:
        page.unlink()


def pictures():
    OUT.mkdir(exist_ok=True)
    shoot((HERE / "masthead.html").read_text(), "body{width:816px}.masthead__row{margin:0 81.6px}", (816, 118), 3, OUT / "masthead.png")
    shoot('<p class="wordmark" style="display:inline-flex;padding:2px 3px 2px 0">McROBERTS<svg viewBox="0 0 14 32">'
          '<line x1="3" y1="30" x2="11" y2="2"/></svg>PAC</p>', "", (232, 36), 4, OUT / "wordmark.png")


# --- WordprocessingML pieces -------------------------------------------------

def run(text, bold=False, color=None, size=None, caps=False, spacing=None):
    rpr = ""
    if bold: rpr += "<w:b/>"
    if caps: rpr += "<w:caps/>"
    if spacing: rpr += f'<w:spacing w:val="{spacing}"/>'
    if color: rpr += f'<w:color w:val="{color}"/>'
    if size: rpr += f'<w:sz w:val="{int(size * 2)}"/><w:szCs w:val="{int(size * 2)}"/>'
    return f'<w:r>{f"<w:rPr>{rpr}</w:rPr>" if rpr else ""}<w:t xml:space="preserve">{escape(text)}</w:t></w:r>'


def para(content="", style=None, ppr=""):
    pstyle = f'<w:pStyle w:val="{style}"/>' if style else ""
    inner = content if content.startswith("<w:") or not content else run(content)
    return f"<w:p><w:pPr>{pstyle}{ppr}</w:pPr>{inner}</w:p>"


def picture(rid, pid, name, w_in, h_in, anchor=False):
    cx, cy = int(w_in * EMU), int(h_in * EMU)
    graphic = (f'<a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic>'
               f'<pic:nvPicPr><pic:cNvPr id="{pid}" name="{name}"/><pic:cNvPicPr/></pic:nvPicPr>'
               f'<pic:blipFill><a:blip r:embed="{rid}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>'
               f'<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="{cx}" cy="{cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr>'
               f'</pic:pic></a:graphicData></a:graphic>')
    doc_pr = f'<wp:docPr id="{pid}" name="{name}" descr="McRoberts PAC, Parent Advisory Council of Hugh McRoberts Secondary"/>'
    if anchor:  # pinned to the top-left corner of the page, edge to edge, behind the text
        return (f'<w:r><w:drawing><wp:anchor distT="0" distB="0" distL="0" distR="0" simplePos="0" relativeHeight="1" behindDoc="1" '
                f'locked="1" layoutInCell="1" allowOverlap="1"><wp:simplePos x="0" y="0"/>'
                f'<wp:positionH relativeFrom="page"><wp:posOffset>0</wp:posOffset></wp:positionH>'
                f'<wp:positionV relativeFrom="page"><wp:posOffset>0</wp:posOffset></wp:positionV>'
                f'<wp:extent cx="{cx}" cy="{cy}"/><wp:effectExtent l="0" t="0" r="0" b="0"/><wp:wrapNone/>{doc_pr}'
                f'<wp:cNvGraphicFramePr><a:graphicFrameLocks noChangeAspect="1"/></wp:cNvGraphicFramePr>{graphic}</wp:anchor></w:drawing></w:r>')
    return (f'<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="{cx}" cy="{cy}"/>'
            f'<wp:effectExtent l="0" t="0" r="0" b="0"/>{doc_pr}<wp:cNvGraphicFramePr><a:graphicFrameLocks noChangeAspect="1"/>'
            f'</wp:cNvGraphicFramePr>{graphic}</wp:inline></w:drawing></w:r>')


def cell(content, width, fill=None, borders=""):
    shd = f'<w:shd w:val="clear" w:color="auto" w:fill="{fill}"/>' if fill else ""
    return f'<w:tc><w:tcPr><w:tcW w:w="{width}" w:type="dxa"/>{borders}{shd}</w:tcPr>{content}</w:tc>'


def table(rows, widths, borders, margins='<w:tblCellMar><w:top w:w="100" w:type="dxa"/><w:left w:w="0" w:type="dxa"/><w:bottom w:w="120" w:type="dxa"/><w:right w:w="160" w:type="dxa"/></w:tblCellMar>'):
    grid = "".join(f'<w:gridCol w:w="{w}"/>' for w in widths)
    return (f'<w:tbl><w:tblPr><w:tblW w:w="{sum(widths)}" w:type="dxa"/><w:tblLayout w:type="fixed"/>{borders}{margins}</w:tblPr>'
            f'<w:tblGrid>{grid}</w:tblGrid>{"".join(rows)}</w:tbl>')


# --- Parts -------------------------------------------------------------------

STYLES = f'''{XML}<w:styles {NS}>
<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="{FONT}" w:hAnsi="{FONT}" w:eastAsia="{FONT}" w:cs="{FONT}"/><w:color w:val="{TEXT}"/><w:sz w:val="20"/><w:szCs w:val="20"/><w:lang w:val="en-CA"/></w:rPr></w:rPrDefault>
<w:pPrDefault><w:pPr><w:spacing w:after="80" w:line="288" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>
<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style>
<w:style w:type="paragraph" w:styleId="Eyebrow"><w:name w:val="Eyebrow"/><w:basedOn w:val="Normal"/><w:next w:val="Title"/><w:qFormat/><w:pPr><w:spacing w:before="0" w:after="40"/></w:pPr><w:rPr><w:b/><w:caps/><w:color w:val="{ACTION}"/><w:spacing w:val="30"/><w:sz w:val="15"/><w:szCs w:val="15"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:basedOn w:val="Normal"/><w:next w:val="Subtitle"/><w:qFormat/><w:pPr><w:spacing w:after="40" w:line="240" w:lineRule="auto"/></w:pPr><w:rPr><w:b/><w:color w:val="{INK}"/><w:spacing w:val="-10"/><w:sz w:val="56"/><w:szCs w:val="56"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Subtitle"><w:name w:val="Subtitle"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:spacing w:after="200"/></w:pPr><w:rPr><w:color w:val="{MUTED}"/><w:sz w:val="21"/><w:szCs w:val="21"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:keepNext/><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr><w:spacing w:before="240" w:after="60"/><w:outlineLvl w:val="0"/></w:pPr><w:rPr><w:b/><w:color w:val="{INK}"/><w:sz w:val="26"/><w:szCs w:val="26"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="ListItem"><w:name w:val="List Item"/><w:basedOn w:val="Normal"/><w:qFormat/><w:pPr><w:numPr><w:ilvl w:val="1"/><w:numId w:val="1"/></w:numPr><w:spacing w:after="60"/></w:pPr></w:style>
<w:style w:type="paragraph" w:styleId="Label"><w:name w:val="Label"/><w:basedOn w:val="Normal"/><w:qFormat/><w:pPr><w:spacing w:after="20"/></w:pPr><w:rPr><w:caps/><w:color w:val="{MUTED}"/><w:spacing w:val="20"/><w:sz w:val="14"/><w:szCs w:val="14"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Footer"><w:name w:val="footer"/><w:basedOn w:val="Normal"/><w:pPr><w:pBdr><w:top w:val="single" w:sz="4" w:space="8" w:color="{LINE}"/></w:pBdr><w:tabs><w:tab w:val="right" w:pos="9792"/></w:tabs><w:spacing w:after="0"/></w:pPr><w:rPr><w:color w:val="{MUTED}"/><w:sz w:val="14"/><w:szCs w:val="14"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Header"><w:name w:val="header"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:after="0"/></w:pPr></w:style>
<w:style w:type="table" w:default="1" w:styleId="TableNormal"><w:name w:val="Normal Table"/><w:tblPr><w:tblInd w:w="0" w:type="dxa"/><w:tblCellMar><w:top w:w="0" w:type="dxa"/><w:left w:w="108" w:type="dxa"/><w:bottom w:w="0" w:type="dxa"/><w:right w:w="108" w:type="dxa"/></w:tblCellMar></w:tblPr></w:style>
</w:styles>'''

NUMBERING = f'''{XML}<w:numbering {NS}>
<w:abstractNum w:abstractNumId="0"><w:multiLevelType w:val="multilevel"/>
<w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="decimal"/><w:lvlText w:val="%1)"/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="567" w:hanging="567"/></w:pPr><w:rPr><w:color w:val="{ACTION}"/></w:rPr></w:lvl>
<w:lvl w:ilvl="1"><w:start w:val="1"/><w:numFmt w:val="lowerLetter"/><w:lvlText w:val="%2)"/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="907" w:hanging="340"/></w:pPr><w:rPr><w:color w:val="{MUTED}"/></w:rPr></w:lvl>
<w:lvl w:ilvl="2"><w:start w:val="1"/><w:numFmt w:val="lowerRoman"/><w:lvlText w:val="%3)"/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="1304" w:hanging="397"/></w:pPr><w:rPr><w:color w:val="{MUTED}"/></w:rPr></w:lvl>
</w:abstractNum><w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num></w:numbering>'''

FONTS = f'''{XML}<w:fonts {NS}><w:font w:name="{FONT}"><w:altName w:val="Calibri"/><w:family w:val="swiss"/><w:pitch w:val="variable"/></w:font></w:fonts>'''

SETTINGS = f'''{XML}<w:settings {NS}><w:defaultTabStop w:val="720"/><w:characterSpacingControl w:val="doNotCompress"/><w:compat><w:compatSetting w:name="compatibilityMode" w:uri="http://schemas.microsoft.com/office/word" w:val="15"/></w:compat></w:settings>'''

MASTHEAD_W, MASTHEAD_H = 8.5, 8.5 * 354 / 2448
WORDMARK_W = 1.25
WORDMARK_H = WORDMARK_W * 144 / 928

# First page: the masthead runs edge to edge; the empty line under it sets where the text starts.
HEADER_FIRST = (f'{XML}<w:hdr {NS}>{para(picture("rIdMast", 10, "masthead.png", MASTHEAD_W, MASTHEAD_H, anchor=True), "Header")}'
                f'<w:p><w:pPr><w:pStyle w:val="Header"/><w:spacing w:line="{int((MASTHEAD_H - 0.1) * 1440)}" w:lineRule="exact"/></w:pPr></w:p></w:hdr>')
HEADER_REST = (f'{XML}<w:hdr {NS}>{para(picture("rIdMark", 11, "wordmark.png", WORDMARK_W, WORDMARK_H), "Header")}</w:hdr>')
FOOTER = (f'{XML}<w:ftr {NS}><w:p><w:pPr><w:pStyle w:val="Footer"/></w:pPr>{run("Hugh McRoberts Secondary Parent Advisory Council  ·  hughmcrobertspac@gmail.com")}'
          f'<w:r><w:tab/></w:r><w:r><w:fldChar w:fldCharType="begin"/></w:r><w:r><w:instrText xml:space="preserve"> PAGE </w:instrText></w:r>'
          f'<w:r><w:fldChar w:fldCharType="separate"/></w:r><w:r><w:t>1</w:t></w:r><w:r><w:fldChar w:fldCharType="end"/></w:r></w:p></w:ftr>')

SECT = ('<w:sectPr><w:headerReference w:type="first" r:id="rIdH1"/><w:headerReference w:type="default" r:id="rIdH2"/>'
        '<w:footerReference w:type="first" r:id="rIdF1"/><w:footerReference w:type="default" r:id="rIdF1"/>'
        '<w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1300" w:right="1224" w:bottom="1150" w:left="1224" w:header="430" w:footer="500" w:gutter="0"/>'
        '<w:titlePg/></w:sectPr>')


def minutes_body():
    rule = f'<w:top w:val="single" w:sz="12" w:color="{INK}"/><w:bottom w:val="single" w:sz="4" w:color="{LINE}"/>'
    facts = [("Date", "Wednesday, [Month Day], [Year]"), ("Time", "7:00 pm"), ("Location", "McRoberts Library and MS Teams"), ("Next meeting", "[Month Day], [Year]")]
    widths = [2700, 1500, 3100, 2492]
    fact_row = "<w:tr>" + "".join(cell(para(label, "Label") + para(run(value, bold=True)), w) for (label, value), w in zip(facts, widths)) + "</w:tr>"
    facts_tbl = table([fact_row], widths, f"<w:tblBorders>{rule}<w:insideV w:val=\"single\" w:sz=\"4\" w:color=\"{LINE}\"/></w:tblBorders>")

    people = [("Attendees", "[Name (role), names of parents present]"), ("Online", "[Names]"), ("School representative", "[Name (Principal)]"), ("Regrets", "[Names]")]
    pw = [2300, 7492]
    people_rows = ["<w:tr>" + cell(para(label, "Label"), pw[0]) + cell(para(text), pw[1]) + "</w:tr>" for label, text in people]
    people_tbl = table(people_rows, pw, f'<w:tblBorders><w:insideH w:val="single" w:sz="4" w:color="{LINE}"/><w:bottom w:val="single" w:sz="4" w:color="{LINE}"/></w:tblBorders>')

    items = [
        ("Welcome and Introductions", ["[Chair] opened the meeting by welcoming everyone at [time]."], False),
        ("Approval of last meeting’s minutes", ["[Name] motioned. [Name] seconded. Approved."], False),
        ("School Administration Report", ["[Item]", "[Item]"], True),
        ("Dates to remember", ["See school calendar (https://mcroberts.sd38.bc.ca/school-calendar)"], False),
        ("Committee Reports", ["Treasurer Report – [balances]", "Secretary Report – [item]", "Fundraising Report – [item]", "RDPA Report – [item]"], True),
        ("New Business", ["[Item]", "[Item]"], True),
        ("Meeting adjourned at [time].", [], False),
    ]
    body = []
    for title, lines, lettered in items:
        body.append(para(title, "Heading1"))
        for line in lines:
            body.append(para(line, "ListItem" if lettered else None, "" if lettered else '<w:ind w:left="567"/>'))

    next_box = table(["<w:tr>" + cell(
        para(run("Next PAC meeting", bold=True, color=GOLD, size=7.5, caps=True, spacing=30), ppr='<w:spacing w:after="40"/>')
        + para(run("[Month Day], [Year]", bold=True, color="FFFFFF", size=20), ppr='<w:spacing w:after="20" w:line="240" w:lineRule="auto"/>')
        + para(run("7:00 p.m. · School Library and MS Teams", color="B9C6BE", size=9.5), ppr='<w:spacing w:after="0"/>'),
        5000, fill=FOREST) + "</w:tr>"], [5000], "",
        '<w:tblCellMar><w:top w:w="220" w:type="dxa"/><w:left w:w="280" w:type="dxa"/><w:bottom w:w="240" w:type="dxa"/><w:right w:w="280" w:type="dxa"/></w:tblCellMar>')

    return ("".join([
        para("Meeting minutes", "Eyebrow"),
        para("[Month Day, Year]", "Title"),
        para("Parent Advisory Council (PAC) minutes · École Secondaire Hugh McRoberts Secondary School", "Subtitle"),
        facts_tbl, para(ppr='<w:spacing w:after="120"/>'),
        people_tbl,
        *body,
        para(ppr='<w:spacing w:after="160"/>'),
        next_box,
        para(),
    ]))


def letter_body():
    return "".join([
        para("[Date]"),
        para(ppr='<w:spacing w:after="160"/>'),
        para("Dear [Name],"),
        para("[Text of the letter.]"),
        para(ppr='<w:spacing w:after="160"/>'),
        para("Sincerely,"),
        para(ppr='<w:spacing w:after="360"/>'),
        para("[Name]"),
        para("[Role], McRoberts PAC"),
    ])


def write_docx(path, body, title):
    document = f"{XML}<w:document {NS}><w:body>{body}{SECT}</w:body></w:document>"
    content_types = (f'{XML}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
                     '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
                     '<Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/>'
                     '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>'
                     '<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>'
                     '<Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/>'
                     '<Override PartName="/word/fontTable.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.fontTable+xml"/>'
                     '<Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/>'
                     '<Override PartName="/word/header1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/>'
                     '<Override PartName="/word/header2.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/>'
                     '<Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/>'
                     '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>'
                     '</Types>')
    rel = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
    root_rels = (f'{XML}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
                 f'<Relationship Id="rId1" Type="{rel}/officeDocument" Target="word/document.xml"/>'
                 '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>'
                 '</Relationships>')
    doc_rels = (f'{XML}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
                f'<Relationship Id="rIdS" Type="{rel}/styles" Target="styles.xml"/>'
                f'<Relationship Id="rIdN" Type="{rel}/numbering" Target="numbering.xml"/>'
                f'<Relationship Id="rIdSet" Type="{rel}/settings" Target="settings.xml"/>'
                f'<Relationship Id="rIdFt" Type="{rel}/fontTable" Target="fontTable.xml"/>'
                f'<Relationship Id="rIdH1" Type="{rel}/header" Target="header1.xml"/>'
                f'<Relationship Id="rIdH2" Type="{rel}/header" Target="header2.xml"/>'
                f'<Relationship Id="rIdF1" Type="{rel}/footer" Target="footer1.xml"/></Relationships>')
    img_rels = lambda rid, img: (f'{XML}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
                                 f'<Relationship Id="{rid}" Type="{rel}/image" Target="media/{img}"/></Relationships>')
    core = (f'{XML}<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" '
            'xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:title>' + escape(title) + '</dc:title><dc:creator>McRoberts PAC</dc:creator></cp:coreProperties>')
    with zipfile.ZipFile(path, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("[Content_Types].xml", content_types)
        z.writestr("_rels/.rels", root_rels)
        z.writestr("docProps/core.xml", core)
        z.writestr("word/document.xml", document)
        z.writestr("word/styles.xml", STYLES)
        z.writestr("word/numbering.xml", NUMBERING)
        z.writestr("word/settings.xml", SETTINGS)
        z.writestr("word/fontTable.xml", FONTS)
        z.writestr("word/_rels/document.xml.rels", doc_rels)
        z.writestr("word/header1.xml", HEADER_FIRST)
        z.writestr("word/_rels/header1.xml.rels", img_rels("rIdMast", "masthead.png"))
        z.writestr("word/header2.xml", HEADER_REST)
        z.writestr("word/_rels/header2.xml.rels", img_rels("rIdMark", "wordmark.png"))
        z.writestr("word/footer1.xml", FOOTER)
        z.write(OUT / "masthead.png", "word/media/masthead.png")
        z.write(OUT / "wordmark.png", "word/media/wordmark.png")
    print(path.relative_to(HERE.parent.parent))


if __name__ == "__main__":
    pictures()
    write_docx(OUT / "mcroberts-pac-minutes-template.docx", minutes_body(), "McRoberts PAC meeting minutes")
    write_docx(OUT / "mcroberts-pac-letterhead.docx", letter_body(), "McRoberts PAC letterhead")
