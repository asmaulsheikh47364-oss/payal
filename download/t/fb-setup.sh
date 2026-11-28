#!/data/data/com.termux/files/usr/bin/bash
# Payal: feedback / helpline table and functions in Supabase (2026-11-28). Safe to run again.
REF=hwfifqyssabwwdjlbqty
command -v python3 >/dev/null || pkg install -y python
mkdir -p ~/payal-db/feedback && cd ~/payal-db/feedback
cat > fb.sql <<'SQLEOF'
-- Payal feedback (2026-11-28). Phones send: kind (live/chat_down/chat_up/help), the question, Payal's answer and the user's note,
-- app version and phone model. Numbers, OTPs, passwords, keys, mails and links are removed on the phone first.
create table if not exists public.feedback (
  id bigserial primary key,
  at timestamptz not null default now(),
  device text, app_ver text, phone text, kind text, q text, a text, note text
);
create index if not exists feedback_at on public.feedback (at);
alter table public.feedback enable row level security;   -- no policies: nobody reads or writes it directly
create table if not exists public.feedback_limit (device text primary key, day date, cnt int);
alter table public.feedback_limit enable row level security;

create or replace function public.submit_feedback(p_device text, p_ver text, p_phone text, p_kind text, p_q text, p_a text, p_note text)
returns json language plpgsql security definer set search_path = public, pg_temp as $$
declare c int;
begin
  if length(coalesce(p_device, '')) < 8 or coalesce(p_kind, '') not in ('live', 'chat_down', 'chat_up', 'help') then return json_build_object('ok', false); end if;
  if p_kind <> 'chat_up' and length(trim(coalesce(p_note, ''))) < 2 then return json_build_object('ok', false, 'why', 'empty'); end if;
  insert into feedback_limit as l (device, day, cnt) values (left(p_device, 64), current_date, 1)
    on conflict (device) do update set cnt = case when l.day = current_date then l.cnt + 1 else 1 end, day = current_date
    returning cnt into c;
  if c > 20 then return json_build_object('ok', false, 'why', 'limit'); end if;                       -- one phone: at most 20 a day
  if (select count(*) from feedback where at > now() - interval '1 hour') >= 1000 then return json_build_object('ok', false, 'why', 'busy'); end if;
  insert into feedback (device, app_ver, phone, kind, q, a, note)
    values (left(p_device, 64), left(p_ver, 40), left(p_phone, 60), p_kind, left(p_q, 1500), left(p_a, 3000), left(p_note, 2000));
  delete from feedback where at < now() - interval '60 days';
  return json_build_object('ok', true);
end $$;
revoke all on function public.submit_feedback(text, text, text, text, text, text, text) from public;
grant execute on function public.submit_feedback(text, text, text, text, text, text, text) to anon, authenticated;

-- Only the owner (logged in with his Gmail) can read them, newest first.
create or replace function public.owner_feedback()
returns json language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if lower(coalesce(auth.jwt() ->> 'email', '')) <> 'asmaulsheikh47364@gmail.com' then return json_build_object('ok', false); end if;
  return json_build_object('ok', true, 'rows', coalesce((
    select json_agg(r) from (
      select kind, app_ver, phone, at, q, a, note from feedback where at > now() - interval '60 days' order by at desc limit 300) r), '[]'::json));
end $$;
revoke all on function public.owner_feedback() from public;
grant execute on function public.owner_feedback() to authenticated;
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
print("DATABASE", q(open("fb.sql", encoding="utf-8").read())[0])
print("CHECK", q("select proname from pg_proc where proname in ('submit_feedback','owner_feedback') order by 1")[1])
PY
[ $? -eq 0 ] && echo "=== TAIYAR: shikayat (feedback) ki jagah ban gayi ===" || echo "=== Kuch step fail hua, upar ka error bhejo ==="
