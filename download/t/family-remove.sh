#!/data/data/com.termux/files/usr/bin/bash
# Family link removal (2026-11-26): drops its tables and functions from the server. Safe to run again.
REF=hwfifqyssabwwdjlbqty
command -v python3 >/dev/null || pkg install -y python
mkdir -p ~/payal-db/community && cd ~/payal-db/community
cat > family-remove.sql <<'SQLEOF'
do $$ declare f regprocedure; begin
  for f in select p.oid::regprocedure from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and (p.proname like 'fl\_%' or p.proname like 'cm\_fam\_%') loop
    execute 'drop function if exists ' || f || ' cascade';
  end loop;
end $$;
drop table if exists public.cm_fam_msg, public.cm_fam_code, public.cm_fam_member, public.cm_fam cascade;
SQLEOF
echo "Supabase access token paste karo (sbp_ se shuru, dikhega nahi), phir Enter:"
read -s TOK
echo ""
TOK=$(echo "$TOK" | grep -o 'sbp_[A-Za-z0-9_]*' | head -1)
[ -n "$TOK" ] || { echo "Token nahi mila: sbp_ se shuru hone wala token paste karo"; exit 1; }
python3 - "$TOK" "$REF" <<'PY'
import sys, json, urllib.request, urllib.error
tok, ref = sys.argv[1:3]
def q(sql):
    req = urllib.request.Request("https://api.supabase.com/v1/projects/%s/database/query" % ref, data=json.dumps({"query": sql}).encode("utf-8"), method="POST",
        headers={"Authorization": "Bearer " + tok, "Content-Type": "application/json", "User-Agent": "curl/8.5.0"})
    try:
        r = urllib.request.urlopen(req, timeout=120); return r.status, r.read().decode("utf-8", "ignore")
    except urllib.error.HTTPError as e:
        print("ERROR", e.code, e.read().decode("utf-8", "ignore")[:400]); sys.exit(1)
print("DATABASE", q(open("family-remove.sql", encoding="utf-8").read())[0])
print("BACHE", q("select count(*) as n from pg_proc where proname like 'fl\\_%' or proname like 'cm\\_fam\\_%'")[1])
PY
[ $? -eq 0 ] && echo "=== TAIYAR: Family link server se hat gaya ===" || echo "=== Kuch step fail hua, upar ka error bhejo ==="
