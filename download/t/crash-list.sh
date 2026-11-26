#!/data/data/com.termux/files/usr/bin/bash
# Payal crash reports of the last 30 days, grouped by code place (no names or numbers are stored in them).
REF=hwfifqyssabwwdjlbqty
command -v python3 >/dev/null || pkg install -y python
echo "Supabase access token paste karo (sbp_ se shuru, dikhega nahi), phir Enter:"
read -s TOK
echo ""
TOK=$(echo "$TOK" | grep -o 'sbp_[A-Za-z0-9_]*' | head -1)
[ -n "$TOK" ] || { echo "Token nahi mila: sbp_ se shuru hone wala token paste karo"; exit 1; }
python3 - "$TOK" "$REF" <<'PY'
import sys, json, urllib.request, urllib.error
tok, ref = sys.argv[1:3]
sql = """select place, app_ver, count(*) as n, count(distinct device) as phones, max(at)::date as last_day,
  (array_agg(android order by at desc))[1] as android, (array_agg(trace order by at desc))[1] as trace
  from crash_reports where at > now() - interval '30 days' group by place, app_ver order by max(at) desc limit 25"""
req = urllib.request.Request("https://api.supabase.com/v1/projects/%s/database/query" % ref, data=json.dumps({"query": sql}).encode(), method="POST",
    headers={"Authorization": "Bearer " + tok, "Content-Type": "application/json", "User-Agent": "curl/8.5.0"})
try:
    rows = json.loads(urllib.request.urlopen(req, timeout=120).read().decode("utf-8", "ignore"))
except urllib.error.HTTPError as e:
    print("ERROR", e.code, e.read().decode("utf-8", "ignore")[:300]); sys.exit(1)
print("CRASH GROUPS:", len(rows))
for i, r in enumerate(rows, 1):
    lines = [l.strip() for l in (r.get("trace") or "").splitlines() if l.strip()]
    keep = lines[:2] + [l for l in lines[2:] if "yesmin" in l][:4]
    print("#%d v%s | %s baar | %s phone | Android %s | %s" % (i, r.get("app_ver"), r.get("n"), r.get("phones"), r.get("android"), r.get("last_day")))
    print("  JAGAH:", (r.get("place") or "")[:160])
    for l in keep: print("  ", l[:160])
PY
