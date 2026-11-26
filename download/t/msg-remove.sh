#!/data/data/com.termux/files/usr/bin/bash
# Payal Chat removal (2026-11-26): empties and deletes its photo/song stores, then drops its tables and functions. Safe to run again.
REF=hwfifqyssabwwdjlbqty
command -v python3 >/dev/null || pkg install -y python
mkdir -p ~/payal-db/messenger && cd ~/payal-db/messenger
cat > remove.sql <<'SQLEOF'
-- Payal Chat removed on the owner's order (2026-11-26): drop all its server parts. cm_limit / cm_hit stay (shared with community).
do $$ declare f regprocedure; begin
  for f in select p.oid::regprocedure from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname like 'msg\_%' loop
    execute 'drop function if exists ' || f || ' cascade';
  end loop;
end $$;
drop table if exists public.msg_story_report, public.msg_story_seen, public.msg_story, public.msg_msg, public.msg_report, public.msg_block, public.msg_friend, public.msg_profile cascade;
do $$ begin
  if exists (select 1 from pg_namespace where nspname = 'storage') then
    drop policy if exists pchat_insert on storage.objects; drop policy if exists pchat_delete on storage.objects;
    drop policy if exists paudio_insert on storage.objects; drop policy if exists paudio_delete on storage.objects;
  end if;
end $$;
SQLEOF
echo "Supabase access token paste karo (sbp_ se shuru, dikhega nahi), phir Enter:"
read -s TOK
echo ""
TOK=$(echo "$TOK" | grep -o 'sbp_[A-Za-z0-9_]*' | head -1)
[ -n "$TOK" ] || { echo "Token nahi mila: sbp_ se shuru hone wala token paste karo"; exit 1; }
python3 - "$TOK" "$REF" <<'PY'
import sys, json, urllib.request, urllib.error
tok, ref = sys.argv[1:3]
SUPA = "https://%s.supabase.co" % ref
def api(path, data=None, method="GET"):
    req = urllib.request.Request("https://api.supabase.com/v1/projects/%s/%s" % (ref, path), data=data, method=method,
        headers={"Authorization": "Bearer " + tok, "Content-Type": "application/json", "User-Agent": "curl/8.5.0"})
    try:
        r = urllib.request.urlopen(req, timeout=120); return r.status, r.read().decode("utf-8", "ignore")
    except urllib.error.HTTPError as e:
        print("ERROR", e.code, e.read().decode("utf-8", "ignore")[:400]); sys.exit(1)
keys = json.loads(api("api-keys?reveal=true")[1])
key = next((k.get("api_key") for k in keys if k.get("name") == "service_role" and k.get("api_key")), None) \
   or next((k.get("api_key") for k in keys if k.get("type") == "secret" and k.get("api_key")), None)
if not key: print("ERROR: server ki chabi nahi mili"); sys.exit(1)
def st(method, path, body=None):
    h = {"apikey": key, "Content-Type": "application/json", "User-Agent": "curl/8.5.0"}
    if key.startswith("eyJ"): h["Authorization"] = "Bearer " + key
    req = urllib.request.Request(SUPA + "/storage/v1/" + path, data=(json.dumps(body).encode() if body is not None else None), method=method, headers=h)
    try: urllib.request.urlopen(req, timeout=120); return "ok"
    except urllib.error.HTTPError as e: return "%d %s" % (e.code, e.read().decode("utf-8", "ignore")[:120])
for b in ("pchat", "paudio", "pmusic"):
    print("STORE", b, "khali:", st("POST", "bucket/%s/empty" % b, {}), "| mitaya:", st("DELETE", "bucket/" + b))
print("DATABASE", api("database/query", json.dumps({"query": open("remove.sql", encoding="utf-8").read()}).encode(), "POST")[0])
print("BACHE", api("database/query", json.dumps({"query": "select count(*) as n from pg_proc where proname like 'msg\\_%'"}).encode(), "POST")[1])
PY
[ $? -eq 0 ] && echo "=== TAIYAR: Payal Chat server se bhi poori tarah hat gaya ===" || echo "=== Kuch step fail hua, upar ka error bhejo ==="
