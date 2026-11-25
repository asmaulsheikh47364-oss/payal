#!/data/data/com.termux/files/usr/bin/bash
# Payal Friends (messenger) part 1: tables and functions in Supabase (2026-11-25). Safe to run again.
REF=hwfifqyssabwwdjlbqty
command -v python3 >/dev/null || pkg install -y python
mkdir -p ~/payal-db/messenger && cd ~/payal-db/messenger
cat > msg.sql <<'SQLEOF'
-- Payal Friends (messenger), part 1 (2026-11-25): Payal ID (= the user's referral code), search, friend requests,
-- private text messages (sealed on the phones, the server only keeps locked text), block and report. Safe to run again.
-- Every table has row level security on and NO policies: phones reach them only through the functions below,
-- as the logged-in Gmail user (auth.uid()).

create table if not exists public.msg_profile (
  uid uuid primary key,
  code text not null unique,
  name text not null,
  bio text not null default '',
  pub text not null default '',
  adult boolean not null default false,
  hidden boolean not null default false,
  created timestamptz not null default now(),
  seen timestamptz not null default now()
);
create index if not exists msg_profile_name on public.msg_profile (lower(name));
alter table public.msg_profile enable row level security;

create table if not exists public.msg_friend (
  a uuid not null, b uuid not null,            -- a < b
  state text not null,                         -- 'pending' or 'ok'
  asked_by uuid not null,
  at timestamptz not null default now(),
  primary key (a, b)
);
alter table public.msg_friend enable row level security;

create table if not exists public.msg_block (uid uuid not null, other uuid not null, at timestamptz not null default now(), primary key (uid, other));
alter table public.msg_block enable row level security;

create table if not exists public.msg_report (id bigserial primary key, by_uid uuid not null, other uuid not null, why text not null, at timestamptz not null default now());
alter table public.msg_report enable row level security;

create table if not exists public.msg_msg (
  id bigserial primary key,
  at timestamptz not null default now(),
  sender uuid not null,
  receiver uuid not null,
  body text not null,                          -- locked text, only the two phones can open it
  nonce text not null,
  seen boolean not null default false
);
create index if not exists msg_msg_pair on public.msg_msg (receiver, sender, id);
create index if not exists msg_msg_pair2 on public.msg_msg (sender, receiver, id);
alter table public.msg_msg enable row level security;

-- daily limits (shares cm_limit / cm_hit from the community setup; created here too if missing)
create table if not exists public.cm_limit (uid uuid not null, what text not null, day date not null, cnt int not null, primary key (uid, what));
alter table public.cm_limit enable row level security;
create or replace function public.cm_hit(p_uid uuid, p_what text, p_max int)
returns boolean language plpgsql security definer set search_path = public, pg_temp as $$
declare c int;
begin
  insert into cm_limit as l (uid, what, day, cnt) values (p_uid, p_what, current_date, 1)
    on conflict (uid, what) do update set cnt = case when l.day = current_date then l.cnt + 1 else 1 end, day = current_date
    returning cnt into c;
  return c <= p_max;
end $$;
revoke all on function public.cm_hit(uuid, text, int) from public, anon, authenticated;

create or replace function public.msg_txt(p text, n int)
returns text language sql immutable set search_path = public, pg_temp as $$
  select left(btrim(regexp_replace(coalesce(p, ''), '\s+', ' ', 'g')), n)
$$;
revoke all on function public.msg_txt(text, int) from public, anon, authenticated;

create or replace function public.msg_blocked(x uuid, y uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from msg_block where (uid = x and other = y) or (uid = y and other = x))
$$;
revoke all on function public.msg_blocked(uuid, uuid) from public, anon, authenticated;

create or replace function public.msg_card(p public.msg_profile)
returns json language sql stable set search_path = public, pg_temp as $$
  select json_build_object('code', p.code, 'name', p.name, 'bio', p.bio)
$$;
revoke all on function public.msg_card(public.msg_profile) from public, anon, authenticated;

-- Join (or update my card). The Payal ID is always the user's own referral code, taken from ref_my on the server.
create or replace function public.msg_register(p_name text, p_bio text, p_adult boolean, p_pub text)
returns json language plpgsql security definer set search_path = public, pg_temp as $$
declare me uuid := auth.uid(); c text; n text := msg_txt(p_name, 40);
begin
  if me is null then return json_build_object('error', 'login'); end if;
  if not coalesce(p_adult, false) then return json_build_object('error', 'adult'); end if;
  if length(n) < 2 then return json_build_object('error', 'name'); end if;
  c := upper(coalesce((public.ref_my())::jsonb ->> 'code', ''));
  if c = '' then return json_build_object('error', 'code'); end if;
  insert into msg_profile (uid, code, name, bio, pub, adult) values (me, c, n, msg_txt(p_bio, 120), left(coalesce(p_pub, ''), 400), true)
    on conflict (uid) do update set code = excluded.code, name = excluded.name, bio = excluded.bio,
      pub = case when excluded.pub <> '' then excluded.pub else msg_profile.pub end, adult = true, seen = now();
  return json_build_object('ok', true, 'code', c);
end $$;

create or replace function public.msg_me()
returns json language plpgsql security definer set search_path = public, pg_temp as $$
declare me uuid := auth.uid(); p msg_profile;
begin
  if me is null then return json_build_object('error', 'login'); end if;
  select * into p from msg_profile where uid = me;
  if not found then return json_build_object('joined', false, 'code', upper(coalesce((public.ref_my())::jsonb ->> 'code', ''))); end if;
  update msg_profile set seen = now() where uid = me;
  return json_build_object('joined', true, 'code', p.code, 'name', p.name, 'bio', p.bio, 'hidden', p.hidden, 'has_pub', p.pub <> '');
end $$;

create or replace function public.msg_set_hidden(p_hidden boolean)
returns json language plpgsql security definer set search_path = public, pg_temp as $$
begin
  update msg_profile set hidden = coalesce(p_hidden, false) where uid = auth.uid();
  return json_build_object('ok', true);
end $$;

-- Search: an exact Payal ID always finds that person; a name finds people who have not hidden themselves.
create or replace function public.msg_find(p_q text)
returns json language plpgsql security definer set search_path = public, pg_temp as $$
declare me uuid := auth.uid(); q text := msg_txt(p_q, 40); res json;
begin
  if me is null then return json_build_object('error', 'login'); end if;
  if not exists (select 1 from msg_profile where uid = me) then return json_build_object('error', 'join'); end if;
  if length(q) < 2 then return json_build_object('items', '[]'::json); end if;
  if not cm_hit(me, 'msg_find', 300) then return json_build_object('error', 'limit'); end if;
  select coalesce(json_agg(x), '[]'::json) into res from (
    select msg_card(p) as card, (upper(p.code) = upper(q)) as exact,
      coalesce((select f.state from msg_friend f where f.a = least(me, p.uid) and f.b = greatest(me, p.uid)), '') as state
    from msg_profile p
    where p.uid <> me and p.adult and not msg_blocked(me, p.uid)
      and (upper(p.code) = upper(q) or (not p.hidden and lower(p.name) like '%' || lower(q) || '%'))
    order by (upper(p.code) = upper(q)) desc, p.seen desc
    limit 25) x;
  return json_build_object('items', res);
end $$;

create or replace function public.msg_request(p_code text)
returns json language plpgsql security definer set search_path = public, pg_temp as $$
declare me uuid := auth.uid(); o uuid; st text;
begin
  if me is null then return json_build_object('error', 'login'); end if;
  if not exists (select 1 from msg_profile where uid = me) then return json_build_object('error', 'join'); end if;
  select uid into o from msg_profile where upper(code) = upper(msg_txt(p_code, 20)) and adult;
  if o is null or o = me then return json_build_object('error', 'nobody'); end if;
  if msg_blocked(me, o) then return json_build_object('error', 'nobody'); end if;
  select state into st from msg_friend where a = least(me, o) and b = greatest(me, o);
  if st = 'ok' then return json_build_object('ok', true, 'state', 'ok'); end if;
  if st = 'pending' then
    -- they had asked me already: asking back means yes
    update msg_friend set state = 'ok', at = now() where a = least(me, o) and b = greatest(me, o) and asked_by = o;
    if found then return json_build_object('ok', true, 'state', 'ok'); end if;
    return json_build_object('ok', true, 'state', 'pending');
  end if;
  if not cm_hit(me, 'msg_req', 40) then return json_build_object('error', 'limit'); end if;
  insert into msg_friend (a, b, state, asked_by) values (least(me, o), greatest(me, o), 'pending', me);
  return json_build_object('ok', true, 'state', 'pending');
end $$;

create or replace function public.msg_answer(p_code text, p_yes boolean)
returns json language plpgsql security definer set search_path = public, pg_temp as $$
declare me uuid := auth.uid(); o uuid;
begin
  select uid into o from msg_profile where upper(code) = upper(msg_txt(p_code, 20));
  if me is null or o is null then return json_build_object('error', 'nobody'); end if;
  if coalesce(p_yes, false) then
    update msg_friend set state = 'ok', at = now() where a = least(me, o) and b = greatest(me, o) and asked_by = o and state = 'pending';
  else
    delete from msg_friend where a = least(me, o) and b = greatest(me, o) and asked_by = o and state = 'pending';
  end if;
  return json_build_object('ok', true);
end $$;

-- Requests waiting for me, my friends (with their lock key, last message and unread count).
create or replace function public.msg_home()
returns json language plpgsql security definer set search_path = public, pg_temp as $$
declare me uuid := auth.uid(); req json; fr json;
begin
  if me is null then return json_build_object('error', 'login'); end if;
  update msg_profile set seen = now() where uid = me;
  select coalesce(json_agg(msg_card(p) order by f.at desc), '[]'::json) into req
    from msg_friend f join msg_profile p on p.uid = f.asked_by
    where f.state = 'pending' and f.asked_by <> me and (f.a = me or f.b = me) and not msg_blocked(me, p.uid);
  select coalesce(json_agg(x order by x.last_id desc nulls last), '[]'::json) into fr from (
    select p.code, p.name, p.bio, p.pub,
      (select max(m.id) from msg_msg m where (m.sender = me and m.receiver = p.uid) or (m.sender = p.uid and m.receiver = me)) as last_id,
      (select m.at from msg_msg m where (m.sender = me and m.receiver = p.uid) or (m.sender = p.uid and m.receiver = me) order by m.id desc limit 1) as last_at,
      (select count(*) from msg_msg m where m.sender = p.uid and m.receiver = me and not m.seen) as unread,
      (p.seen > now() - interval '3 minutes') as online
    from msg_friend f join msg_profile p on p.uid = (case when f.a = me then f.b else f.a end)
    where f.state = 'ok' and (f.a = me or f.b = me) and not msg_blocked(me, p.uid)) x;
  return json_build_object('requests', req, 'friends', fr);
end $$;

create or replace function public.msg_send(p_code text, p_body text, p_nonce text)
returns json language plpgsql security definer set search_path = public, pg_temp as $$
declare me uuid := auth.uid(); o uuid; nid bigint;
begin
  select uid into o from msg_profile where upper(code) = upper(msg_txt(p_code, 20));
  if me is null or o is null then return json_build_object('error', 'nobody'); end if;
  if not exists (select 1 from msg_friend where a = least(me, o) and b = greatest(me, o) and state = 'ok') then return json_build_object('error', 'friend'); end if;
  if msg_blocked(me, o) then return json_build_object('error', 'blocked'); end if;
  if length(coalesce(p_body, '')) = 0 or length(p_body) > 12000 then return json_build_object('error', 'size'); end if;
  if not cm_hit(me, 'msg_send', 1500) then return json_build_object('error', 'limit'); end if;
  insert into msg_msg (sender, receiver, body, nonce) values (me, o, p_body, left(coalesce(p_nonce, ''), 64)) returning id into nid;
  return json_build_object('ok', true, 'id', nid);
end $$;

-- Messages between me and one friend after a message number; the ones sent to me are marked seen.
create or replace function public.msg_poll(p_code text, p_after bigint)
returns json language plpgsql security definer set search_path = public, pg_temp as $$
declare me uuid := auth.uid(); o uuid; res json; their_seen bigint;
begin
  select uid into o from msg_profile where upper(code) = upper(msg_txt(p_code, 20));
  if me is null or o is null then return json_build_object('error', 'nobody'); end if;
  if not exists (select 1 from msg_friend where a = least(me, o) and b = greatest(me, o) and state = 'ok') then return json_build_object('error', 'friend'); end if;
  select coalesce(json_agg(json_build_object('id', m.id, 'at', m.at, 'mine', m.sender = me, 'body', m.body, 'nonce', m.nonce) order by m.id), '[]'::json) into res
    from (select * from msg_msg m where ((m.sender = me and m.receiver = o) or (m.sender = o and m.receiver = me)) and m.id > coalesce(p_after, 0)
          order by m.id desc limit 200) m;
  update msg_msg set seen = true where sender = o and receiver = me and not seen;
  select coalesce(max(id), 0) into their_seen from msg_msg where sender = me and receiver = o and seen;
  update msg_profile set seen = now() where uid = me;
  return json_build_object('items', res, 'seen_upto', their_seen,
    'online', (select p.seen > now() - interval '3 minutes' from msg_profile p where p.uid = o));
end $$;

create or replace function public.msg_block_user(p_code text)
returns json language plpgsql security definer set search_path = public, pg_temp as $$
declare me uuid := auth.uid(); o uuid;
begin
  select uid into o from msg_profile where upper(code) = upper(msg_txt(p_code, 20));
  if me is null or o is null then return json_build_object('error', 'nobody'); end if;
  insert into msg_block (uid, other) values (me, o) on conflict do nothing;
  delete from msg_friend where a = least(me, o) and b = greatest(me, o);
  return json_build_object('ok', true);
end $$;

create or replace function public.msg_report_user(p_code text, p_why text)
returns json language plpgsql security definer set search_path = public, pg_temp as $$
declare me uuid := auth.uid(); o uuid;
begin
  select uid into o from msg_profile where upper(code) = upper(msg_txt(p_code, 20));
  if me is null or o is null then return json_build_object('error', 'nobody'); end if;
  if not cm_hit(me, 'msg_report', 20) then return json_build_object('error', 'limit'); end if;
  insert into msg_report (by_uid, other, why) values (me, o, msg_txt(p_why, 200));
  insert into msg_block (uid, other) values (me, o) on conflict do nothing;
  delete from msg_friend where a = least(me, o) and b = greatest(me, o);
  -- three different people reporting the same person: that person is hidden from search and cannot ask anyone
  if (select count(distinct by_uid) from msg_report where other = o) >= 3 then
    update msg_profile set hidden = true, adult = false where uid = o;
  end if;
  return json_build_object('ok', true);
end $$;

do $$ declare f text; begin
  foreach f in array array['msg_register(text,text,boolean,text)','msg_me()','msg_set_hidden(boolean)','msg_find(text)','msg_request(text)',
    'msg_answer(text,boolean)','msg_home()','msg_send(text,text,text)','msg_poll(text,bigint)','msg_block_user(text)','msg_report_user(text,text)'] loop
    execute 'revoke all on function public.' || f || ' from public, anon';
    execute 'grant execute on function public.' || f || ' to authenticated';
  end loop;
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
def q(sql):
    req = urllib.request.Request("https://api.supabase.com/v1/projects/%s/database/query" % ref, data=json.dumps({"query": sql}).encode("utf-8"), method="POST",
        headers={"Authorization": "Bearer " + tok, "Content-Type": "application/json", "User-Agent": "curl/8.5.0"})
    try:
        r = urllib.request.urlopen(req, timeout=120); return r.status, r.read().decode("utf-8", "ignore")
    except urllib.error.HTTPError as e:
        print("ERROR", e.code, e.read().decode("utf-8", "ignore")[:400]); sys.exit(1)
print("DATABASE", q(open("msg.sql", encoding="utf-8").read())[0])
print("CHECK", q("select proname from pg_proc where proname like 'msg_%' order by 1")[1])
PY
[ $? -eq 0 ] && echo "=== TAIYAR: Friends (baatcheet) ki jagah ban gayi ===" || echo "=== Kuch step fail hua, upar ka error bhejo ==="
