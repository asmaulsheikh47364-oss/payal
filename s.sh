#!/data/data/com.termux/files/usr/bin/bash
# Payal server check: READ-ONLY. It only runs SELECT queries and changes nothing on the server.
# Output is shown here and saved to /sdcard/Download/payal-server-check.txt
REF=hwfifqyssabwwdjlbqty
OUT=/sdcard/Download/payal-server-check.txt
command -v python3 >/dev/null || pkg install -y python
echo "Supabase access token paste karo (dikhega nahi), phir Enter:"
read -s TOK
echo ""
TOK=$(echo "$TOK" | grep -o 'sbp_[A-Za-z0-9_]*' | head -1)
[ -n "$TOK" ] || { echo "Token nahi mila: sbp_ se shuru hone wala token paste karo"; exit 1; }
python3 - "$TOK" "$REF" "$OUT" <<'PY'
import sys, json, urllib.request, urllib.error
tok, ref, out_path = sys.argv[1], sys.argv[2], sys.argv[3]
URL = "https://api.supabase.com/v1/projects/%s/database/query" % ref

def q(sql):
    req = urllib.request.Request(URL, data=json.dumps({"query": sql}).encode(), method="POST",
        headers={"Authorization": "Bearer " + tok, "Content-Type": "application/json", "User-Agent": "curl/8.5.0"})
    try:
        with urllib.request.urlopen(req, timeout=90) as r:
            return json.loads(r.read().decode("utf-8", "ignore") or "[]")
    except urllib.error.HTTPError as e:
        return {"error": e.code, "detail": e.read().decode("utf-8", "ignore")[:600]}
    except Exception as e:
        return {"error": str(e)}

# Every query below is a plain SELECT (read only).
Q = [
 ("1. FUNCTIONS IN public (security definer, uses is_admin(), who can EXECUTE)", """
select p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')' as fn,
       case when p.prosecdef then 'yes' else 'no' end as sec_definer,
       case when p.prokind = 'f' and pg_get_functiondef(p.oid) like '%is_admin(%' then 'yes' else 'no' end as calls_is_admin,
       case when has_function_privilege('anon', p.oid, 'EXECUTE') then 'yes' else 'no' end as anon,
       case when has_function_privilege('authenticated', p.oid, 'EXECUTE') then 'yes' else 'no' end as authenticated,
       case when exists (select 1 from aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a
                         where a.grantee = 0 and a.privilege_type = 'EXECUTE') then 'yes' else 'no' end as public
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.prokind in ('f', 'p')
order by p.proname"""),
 ("2a. TABLES IN public (RLS on?)", """
select c.relname as tbl,
       case when c.relrowsecurity then 'yes' else 'no' end as rls,
       case when c.relforcerowsecurity then 'yes' else 'no' end as rls_forced
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind in ('r', 'p')
order by c.relname"""),
 ("2b. POLICIES IN public", """
select tablename as tbl, policyname as policy, cmd, array_to_string(roles, ',') as roles,
       coalesce(qual, '') as using_expr, coalesce(with_check, '') as check_expr
from pg_policies where schemaname = 'public'
order by tablename, policyname"""),
 ("3. BODY OF public.is_admin()", """
select p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')' as fn, pg_get_functiondef(p.oid) as body
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'is_admin' and p.prokind in ('f','p')"""),
 ("4. BODIES OF FUNCTIONS WITH pay / verify / claim / grant / plan IN THE NAME", """
select p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')' as fn, pg_get_functiondef(p.oid) as body
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.prokind = 'f'
  and (p.proname ilike '%pay%' or p.proname ilike '%verify%' or p.proname ilike '%claim%'
       or p.proname ilike '%grant%' or p.proname ilike '%plan%')
order by p.proname"""),
]

lines = []
def say(s=""):
    print(s)
    lines.append(s)

for title, sql in Q:
    say("=" * 60)
    say(title)
    say("=" * 60)
    rows = q(sql)
    if isinstance(rows, dict):
        say("ERROR: " + json.dumps(rows, ensure_ascii=False))
        continue
    if not rows:
        say("(nothing)")
        continue
    for r in rows:
        if "body" in r:
            say("--- " + str(r.get("fn")))
            say(str(r.get("body")).rstrip())
        else:
            say(" | ".join("%s=%s" % (k, " ".join(str(v).split())) for k, v in r.items()))
    say("")

try:
    with open(out_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")
    print("SAVED: " + out_path)
except Exception as e:
    print("File save nahi hua (" + str(e) + "). Termux mein pehle termux-setup-storage chalao.")
PY
