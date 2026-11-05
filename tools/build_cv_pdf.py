#!/usr/bin/env python3
"""Build assets/Aditya_Pawar.pdf from _data/cv.yml and _data/profile.yml.
Needs PyYAML and Google Chrome. Run from the repository root:  python3 tools/build_cv_pdf.py
"""
import html, os, re, shutil, subprocess, sys, tempfile
import yaml

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
cv = yaml.safe_load(open(os.path.join(ROOT, "_data/cv.yml")))
pr = yaml.safe_load(open(os.path.join(ROOT, "_data/profile.yml")))
E = html.escape
bold = lambda s: re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", E(s))
site = "https://pawarad.github.io"

def links():
    out = []
    for label, url in (("GitHub", pr["links"]["github"]), ("LinkedIn", pr["links"]["linkedin"]),
                       ("Google Scholar", pr["links"]["scholar"]), ("Website", site + "/")):
        if url:
            out.append(f'<a href="{E(url)}">{label}</a>')
    return " | ".join(out)

jobs = []
for j in cv["experience"]:
    body = ""
    for g in j["groups"]:
        if g["heading"]:
            body += f'<h4>{E(g["heading"])}</h4>'
        body += "<ul>"
        for b in g["bullets"]:
            sub = "".join(f"<li>{E(s)}</li>" for s in b.get("sub", []))
            body += f'<li>{E(b["text"])}' + (f"<ul>{sub}</ul>" if sub else "") + "</li>"
        body += "</ul>"
    jobs.append(f'<div class="job"><div class="jh"><b>{E(j["role"])}, {E(j["org"])}</b></div>'
                f'<div class="jd">{E(j["place"])} | {E(j["dates"])}</div>{body}</div>')

skills = "".join(f'<p class="sk"><b>{E(g["group"])}:</b> {E(g["items"])}</p>' for g in cv["skills"])
pubs = "".join(f"<li>{bold(x)}</li>" for x in cv["publications"])
edu = "".join(f'<p class="sk"><b>{E(e["degree"])}</b>, {E(e["school"])} | {E(e["dates"])}</p>' for e in cv["education"])

doc = f"""<!doctype html><html><head><meta charset="utf-8"><title>Aditya Pawar</title>
<style>
@page {{ size: Letter; margin: 0.45in 0.55in; }}
body {{ font-family: "Liberation Sans", Arial, Helvetica, sans-serif; font-size: 9.1pt; line-height: 1.27; color: #111; margin: 0; }}
h1 {{ font-size: 19pt; text-align: center; margin: 0 0 2pt; letter-spacing: 0.5pt; }}
.contact {{ text-align: center; margin: 0 0 8pt; }}
a {{ color: #111; text-decoration: none; }}
h2 {{ font-size: 10.5pt; text-transform: uppercase; letter-spacing: 0.6pt; border-bottom: 0.8pt solid #111; padding-bottom: 1pt; margin: 7pt 0 3pt; }}
h4 {{ font-size: 9.1pt; margin: 5pt 0 1pt; font-style: italic; }}
p {{ margin: 0 0 3pt; }}
.sk {{ margin: 0 0 2pt; }}
.job {{ margin-bottom: 6pt; }}
.jd {{ color: #333; margin-bottom: 1pt; }}
ul {{ margin: 1pt 0 2pt; padding-left: 14pt; }}
li {{ margin-bottom: 1.5pt; }}
li ul {{ margin-top: 1pt; list-style: circle; }}
.job {{ break-inside: auto; }}
h2, h4, .jh, .jd {{ break-after: avoid; }}
li {{ break-inside: avoid; }}
</style></head><body>
<h1>ADITYA PAWAR</h1>
<p class="contact">{E(pr["location"])} | {links()}</p>
<h2>Professional summary</h2><p>{E(cv["summary"])}</p>
<h2>Technical skills</h2>{skills}
<h2>Professional experience</h2>{"".join(jobs)}
<h2>Selected publications</h2><ul>{pubs}</ul>
<h2>Education</h2>{edu}
</body></html>"""

out = os.path.join(ROOT, "assets", "Aditya_Pawar.pdf")
tmp = tempfile.mkdtemp()
src = os.path.join(tmp, "cv.html")
open(src, "w", encoding="utf-8").write(doc)
chrome = shutil.which("google-chrome") or shutil.which("chromium") or sys.exit("Chrome not found")
subprocess.run([chrome, "--headless=new", "--no-sandbox", "--disable-gpu", "--no-pdf-header-footer",
                f"--print-to-pdf={out}", "file://" + src], check=True, capture_output=True, timeout=120)
print("wrote", out)
