import json, re, hashlib, datetime
from pathlib import Path
import pandas as pd

ROOT = Path(".")
XLS = ROOT / "pasion" / "cnam" / "sources" / "cnam_vei_regime_base.xls"
SEED = ROOT / "supabase" / "seeds" / "cnam_medications_seed.sql"
RULES = ROOT / "pasion" / "cnam" / "tn_cnam_rules.json"

def sha256_file(p: Path):
    h = hashlib.sha256()
    with p.open("rb") as f:
        for chunk in iter(lambda: f.read(1024*1024), b""):
            h.update(chunk)
    return h.hexdigest()

def is_html_file(p: Path) -> bool:
    try:
        head = p.read_bytes()[:512].decode("utf-8", errors="ignore").lower()
        return "<html" in head or "<!doctype" in head
    except Exception:
        return False

if not XLS.exists():
    raise SystemExit("XLS missing: " + str(XLS))

if is_html_file(XLS):
    raise SystemExit("XLS is HTML (download failed / redirected). Re-download with a browser and replace file: " + str(XLS))

# Read all sheets best-effort
dfs = []
read_ok = False
errors = []
for engine in ("xlrd","openpyxl"):
    try:
        book = pd.read_excel(XLS, sheet_name=None, engine=engine)
        for name, df in book.items():
            if df is None or df.empty:
                continue
            dfs.append((name, df))
        read_ok = True
        break
    except Exception as e:
        errors.append((engine, str(e)))

if not read_ok:
    raise SystemExit("Cannot read XLS. Errors: " + str(errors))

meds = []
def pick_text_col(df):
    # choose the column with the highest ratio of non-empty string-ish values
    best = None
    best_score = -1
    for c in df.columns:
        s = df[c].astype(str).str.strip()
        # exclude columns that look like numeric-only IDs
        nonempty = (s != "") & (s.str.lower() != "nan") & (s.str.lower() != "none")
        score = int(nonempty.sum())
        if score > best_score:
            best_score = score
            best = c
    return best

for sheet, df in dfs:
    df = df.copy()
    # normalize columns
    df.columns = [str(c).strip() for c in df.columns]
    col = pick_text_col(df)
    if col is None:
        continue

    for v in df[col].astype(str).tolist():
        t = str(v).strip()
        if not t or t.lower() in ("nan","none"):
            continue
        # keep only reasonable text lengths
        if len(t) < 3:
            continue
        # remove obvious headers/noise
        if "LISTE" in t.upper() and len(t) > 10:
            continue
        meds.append(t)

# Deduplicate
seen=set()
dedup=[]
for t in meds:
    k=t.lower()
    if k in seen: 
        continue
    seen.add(k)
    dedup.append(t[:300])
meds = dedup

# Build rules JSON minimal (keep existing if present, else create)
now = datetime.datetime.utcnow().replace(microsecond=0).isoformat()+"Z"
rules = {
  "country": "TN",
  "payer": "CNAM",
  "version": "0.2.1",
  "generatedAt": now,
  "sources": [
    {"name": "CNAM XLS (VEI couverts régime de base)", "path": str(XLS).replace("\\","/"), "sha256": sha256_file(XLS)}
  ],
  "default": {"renewalLeadDays": 7, "maxDispenseDaysIfUnknown": 30},
  "disclaimer": "Règles CNAM: à valider à partir des textes officiels. DONIA ne génère pas de prescription finale automatiquement. Validation humaine obligatoire.",
  "conditions": [
    {"code": "CHRONIC_GENERIC", "label": "Maladie chronique (générique)", "renewal": {"dispenseDays": 30, "appointmentOffsetDays": 23}}
  ],
  "medicationRules": []
}

RULES.parent.mkdir(parents=True, exist_ok=True)
RULES.write_text(json.dumps(rules, ensure_ascii=False, indent=2), encoding="utf-8")

# Generate seed SQL
SEED.parent.mkdir(parents=True, exist_ok=True)

def esc(s):
    return "'" + str(s).replace("'", "''") + "'"

lines=[]
lines.append("-- DONIA seed: cnam_medications (best-effort from CNAM XLS)")
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
lines.append("create unique index if not exists cnam_meds_uniq on public.cnam_medications(country_code,payer,dci);")

count=0
for dci in meds[:8000]:
    lines.append(f"""
insert into public.cnam_medications(country_code,payer,dci,reimbursable,updated_at)
values('TN','CNAM',{esc(dci)},true,now())
on conflict (country_code,payer,dci) do update set updated_at=now();
""".strip())
    count += 1

lines.append("commit;")
SEED.write_text("\n".join(lines), encoding="utf-8")

print("OK meds:", count)
print("seed:", SEED)
print("rules:", RULES)
