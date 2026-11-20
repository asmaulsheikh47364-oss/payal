#!/data/data/com.termux/files/usr/bin/bash
# Payal: crash reports table and functions in Supabase (2026-11-20). Safe to run again.
REF=hwfifqyssabwwdjlbqty
command -v python3 >/dev/null || pkg install -y python
mkdir -p ~/payal-db/crash && cd ~/payal-db/crash
cat > crash.sql <<'SQLEOF'
-- Payal crash reports (2026-11-20). Phones send only: app version, phone model, Android version, the code place and the error lines (private data removed on the phone).
create table if not exists public.crash_reports (
  id bigserial primary key,
  at timestamptz not null default now(),
  device text, app_ver text, phone text, android text, place text, trace text
);
create index if not exists crash_reports_at on public.crash_reports (at);
alter table public.crash_reports enable row level security;   -- no policies: nobody reads or writes it directly
create table if not exists public.crash_limit (device text primary key, day date, cnt int);
alter table public.crash_limit enable row level security;

create or replace function public.report_crash(p_device text, p_ver text, p_phone text, p_android text, p_place text, p_trace text)
returns json language plpgsql security definer set search_path = public, pg_temp as $$
declare c int;
begin
  if length(coalesce(p_device, '')) < 8 or length(coalesce(p_trace, '')) < 10 then return json_build_object('ok', false); end if;
  insert into crash_limit as l (device, day, cnt) values (left(p_device, 64), current_date, 1)
    on conflict (device) do update set cnt = case when l.day = current_date then l.cnt + 1 else 1 end, day = current_date
    returning cnt into c;
  if c > 5 then return json_build_object('ok', false, 'why', 'limit'); end if;                       -- one phone: at most 5 a day
  if (select count(*) from crash_reports where at > now() - interval '1 hour') >= 500 then return json_build_object('ok', false, 'why', 'busy'); end if;
  insert into crash_reports (device, app_ver, phone, android, place, trace)
    values (left(p_device, 64), left(p_ver, 40), left(p_phone, 60), left(p_android, 20), left(p_place, 300), left(p_trace, 4000));
  delete from crash_reports where at < now() - interval '60 days';
  return json_build_object('ok', true);
end $$;
revoke all on function public.report_crash(text, text, text, text, text, text) from public;
grant execute on function public.report_crash(text, text, text, text, text, text) to anon, authenticated;

-- Only the owner (logged in with his Gmail) can read them: grouped by code place and app version, newest first.
create or replace function public.owner_crashes()
returns json language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if lower(coalesce(auth.jwt() ->> 'email', '')) <> 'asmaulsheikh47364@gmail.com' then return json_build_object('ok', false); end if;
  return json_build_object('ok', true, 'rows', coalesce((
    select json_agg(r) from (
      select place, app_ver, max(at) as last_at, count(*) as n, count(distinct device) as phones,
             (array_agg(phone order by at desc))[1] as phone, (array_agg(android order by at desc))[1] as android,
             (array_agg(trace order by at desc))[1] as trace
      from crash_reports where at > now() - interval '30 days'
      group by place, app_ver order by max(at) desc limit 50) r), '[]'::json));
end $$;
revoke all on function public.owner_crashes() from public;
grant execute on function public.owner_crashes() to authenticated;
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
print("DATABASE", q(open("crash.sql", encoding="utf-8").read())[0])
print("CHECK", q("select proname from pg_proc where proname in ('report_crash','owner_crashes') order by 1")[1])
PY
[ $? -eq 0 ] && echo "=== TAIYAR: crash report ki jagah ban gayi ===" || echo "=== Kuch step fail hua, upar ka error bhejo ==="
