import json, re, hashlib, datetime
from pathlib import Path

import pandas as pd
import fitz  # pymupdf

ROOT = Path(".")
SOURCES = ROOT / "pasion" / "cnam" / "sources"
RULES_PATH = ROOT / "pasion" / "cnam" / "tn_cnam_rules.json"
SEED_SQL = ROOT / "supabase" / "seeds" / "cnam_medications_seed.sql"

pdf_path = SOURCES / "cnam_list_APclmed.pdf"
xls_path = SOURCES / "cnam_vei_regime_base.xls"

def sha256_file(p: Path):
    h = hashlib.sha256()
    with p.open("rb") as f:
        for chunk in iter(lambda: f.read(1024*1024), b""):
            h.update(chunk)
    return h.hexdigest()

# --------- 1) Extract meds from XLS (most reliable)
meds = []
xls_ok = False
try:
    # xlrd supports .xls
    df = pd.read_excel(xls_path, engine="xlrd")
    xls_ok = True
except Exception:
    # fallback try openpyxl (sometimes file is actually xlsx)
    try:
        df = pd.read_excel(xls_path, engine="openpyxl")
        xls_ok = True
    except Exception as e:
        df = None
        xls_ok = False

if xls_ok and df is not None:
    # Normalize columns loosely
    cols = [str(c).strip() for c in df.columns]
    df.columns = cols

    # Heuristic mapping
    # Many CNAM lists have a "DCI" column or similar; if not, we keep a best-effort text line
    candidates = ["DCI", "Dci", "dci", "Denomination", "Dénomination", "DESIGNATION", "Designation", "Libelle", "LIBELLE"]
    dci_col = next((c for c in df.columns if c in candidates), None)

    for _, row in df.iterrows():
        dci = None
        if dci_col is not None:
            dci = str(row.get(dci_col, "")).strip()
        else:
            # best effort: join non-null cells
            parts = [str(row[c]).strip() for c in df.columns if str(row.get(c, "")).strip() not in ("", "nan", "None")]
            dci = parts[0] if parts else ""

        if not dci or dci.lower() in ("nan","none"):
            continue

        meds.append({
            "country_code": "TN",
            "payer": "CNAM",
            "code": None,
            "atc": None,
            "dci": dci[:300],
            "brand": None,
            "form": None,
            "strength": None,
            "reimbursable": True
        })

# Deduplicate by dci
seen = set()
dedup = []
for m in meds:
    k = m["dci"].lower()
    if k in seen: 
        continue
    seen.add(k)
    dedup.append(m)
meds = dedup

# --------- 2) Extract "agreement prior" signals from PDF (light extraction)
# We do NOT attempt perfect parsing; we only detect if a DCI appears in the PDF text, to tag "priorAgreement".
prior_set = set()
try:
    doc = fitz.open(pdf_path)
    text = ""
    for i in range(min(8, doc.page_count)):  # first pages enough for headers + early items
        text += doc.load_page(i).get_text("text") + "\n"
    doc.close()

    # crude tokenization: uppercase words sequences often contain DCI headings
    # We capture likely DCI-like words (letters+spaces) and normalize
    for line in text.splitlines():
        l = line.strip()
        if len(l) < 3:
            continue
        # skip obvious headers
        if "LISTE EXAUSTIVE" in l or "CAISSE NATIONALE" in l:
            continue
        # detect DCI-ish: mostly letters/spaces, limited punctuation
        if re.match(r"^[A-Z0-9][A-Z0-9 \-\+']{2,60}$", l):
            # keep only alpha-starting sequences
            prior_set.add(l.strip())
except Exception:
    pass

# --------- 3) Build rules JSON (configurable; no hardcoded CNAM durations)
now = datetime.datetime.utcnow().replace(microsecond=0).isoformat()+"Z"

rules = {
  "country": "TN",
  "payer": "CNAM",
  "version": "0.2.0",
  "generatedAt": now,
  "sources": [
    {
      "name": "CNAM PDF - spécialités soumises à l'accord préalable (classées par DCI)",
      "path": str(pdf_path).replace("\\","/"),
      "sha256": sha256_file(pdf_path) if pdf_path.exists() else None
    },
    {
      "name": "CNAM XLS - liste des médicaments classés en VEI couverts par le régime de base",
      "path": str(xls_path).replace("\\","/"),
      "sha256": sha256_file(xls_path) if xls_path.exists() else None
    }
  ],
  "disclaimer": "Règles CNAM: à valider à partir des circulaires/listes CNAM officielles. DONIA ne produit pas de prescription finale automatiquement. Validation humaine obligatoire.",
  "default": {
    "renewalLeadDays": 7,
    "maxDispenseDaysIfUnknown": 30
  },
  "priorAgreement": {
    "enabled": True,
    "matchMode": "by_dci_text_presence",
    "notes": "DONIA marque 'prior agreement' si DCI détectée dans le PDF CNAM accord préalable (extraction best-effort)."
  },
  "conditions": [
    { "code": "CHRONIC_GENERIC", "label": "Maladie chronique (générique)", "renewal": { "dispenseDays": 30, "appointmentOffsetDays": 23 } }
  ],
  "medicationRules": []
}

# Optionally add sample medication rules for prior agreement DCIs (no durations changes)
# We only add tags; renewal schedule remains default unless you edit rules.
# Keep it small to avoid huge JSON; you can expand later.
sample_prior = list(prior_set)[:50]
for dci in sample_prior:
    rules["medicationRules"].append({
        "dciContains": dci[:60],
        "label": f"Accord préalable (détecté): {dci[:40]}",
        "tags": ["priorAgreement"]
    })

RULES_PATH.parent.mkdir(parents=True, exist_ok=True)
RULES_PATH.write_text(json.dumps(rules, ensure_ascii=False, indent=2), encoding="utf-8")

# --------- 4) Build seed SQL for cnam_medications (upsert by dci)
def esc(s):
    if s is None:
        return "NULL"
    return "'" + str(s).replace("'", "''") + "'"

lines = []
lines.append("-- DONIA seed: cnam_medications (best-effort from CNAM sources)")
lines.append("begin;")
lines.append("create extension if not exists pgcrypto;")
lines.append("""
create table if not exists public.cnam_medications (
  id uuid primary key default gen_random_uuid(),
  country_code text not null default 'TN',
  payer text not null default 'CNAM',
  code text,
  atc text,
  dci text not null,
  brand text,
  form text,
  strength text,
  reimbursable boolean default true,
  updated_at timestamptz not null default now()
);
""".strip())

# Ensure unique index on (country_code,payer,dci)
lines.append("create unique index if not exists cnam_meds_uniq on public.cnam_medications(country_code,payer,dci);")

for m in meds[:5000]:  # safety cap
    lines.append(f"""
insert into public.cnam_medications(country_code,payer,code,atc,dci,brand,form,strength,reimbursable,updated_at)
values(
  {esc(m["country_code"])},
  {esc(m["payer"])},
  {esc(m["code"])},
  {esc(m["atc"])},
  {esc(m["dci"])},
  {esc(m["brand"])},
  {esc(m["form"])},
  {esc(m["strength"])},
  {str(bool(m["reimbursable"])).lower()},
  now()
)
on conflict (country_code,payer,dci)
do update set
  code=excluded.code,
  atc=excluded.atc,
  brand=excluded.brand,
  form=excluded.form,
  strength=excluded.strength,
  reimbursable=excluded.reimbursable,
  updated_at=now();
""".strip())

lines.append("commit;")

SEED_SQL.write_text("\n".join(lines), encoding="utf-8")

print("OK")
print("rules:", RULES_PATH)
print("seed :", SEED_SQL)
print("meds :", len(meds))
