#!/data/data/com.termux/files/usr/bin/bash
# Payal: village alerts, family link and work board tables and functions in Supabase (2026-11-24). Safe to run again.
REF=hwfifqyssabwwdjlbqty
command -v python3 >/dev/null || pkg install -y python
mkdir -p ~/payal-db/community && cd ~/payal-db/community
cat > community.sql <<'SQLEOF'
-- Payal community features (2026-11-24): village alerts, family link, work board. Safe to run again.
-- Every table has row level security on and NO policies: nobody reads or writes them directly.
-- Phones reach them only through the functions below, as the logged-in Gmail user (auth.uid()).

-- ---------- shared helpers ----------
create table if not exists public.cm_limit (uid uuid not null, what text not null, day date not null, cnt int not null, primary key (uid, what));
alter table public.cm_limit enable row level security;

-- One more use of <what> today for this user; false when the daily limit is reached.
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

-- Distance in km between two points (haversine).
create or replace function public.cm_km(a_lat double precision, a_lon double precision, b_lat double precision, b_lon double precision)
returns double precision language sql immutable set search_path = public, pg_temp as $$
  select 2 * 6371 * asin(least(1, sqrt(
    power(sin(radians(b_lat - a_lat) / 2), 2) +
    cos(radians(a_lat)) * cos(radians(b_lat)) * power(sin(radians(b_lon - a_lon) / 2), 2))))
$$;
revoke all on function public.cm_km(double precision, double precision, double precision, double precision) from public, anon, authenticated;

-- Short clean text: one line, no extra spaces, at most n letters.
create or replace function public.cm_txt(p text, n int)
returns text language sql immutable set search_path = public, pg_temp as $$
  select left(btrim(regexp_replace(coalesce(p, ''), '\s+', ' ', 'g')), n)
$$;
revoke all on function public.cm_txt(text, int) from public, anon, authenticated;

create or replace function public.cm_ok_place(p_lat double precision, p_lon double precision)
returns boolean language sql immutable set search_path = public, pg_temp as $$
  select p_lat is not null and p_lon is not null and p_lat between -90 and 90 and p_lon between -180 and 180 and not (p_lat = 0 and p_lon = 0)
$$;
revoke all on function public.cm_ok_place(double precision, double precision) from public, anon, authenticated;

-- ---------- 1. village alerts ----------
create table if not exists public.cm_alerts (
  id bigserial primary key,
  at timestamptz not null default now(),
  expires timestamptz not null,
  uid uuid not null,
  kind text not null,
  body text not null,
  lat double precision not null,
  lon double precision not null,
  owner_ok boolean not null default false
);
create index if not exists cm_alerts_exp on public.cm_alerts (expires);
alter table public.cm_alerts enable row level security;
create table if not exists public.cm_alert_ok (
  alert_id bigint not null references public.cm_alerts (id) on delete cascade,
  uid uuid not null,
  at timestamptz not null default now(),
  primary key (alert_id, uid)
);
alter table public.cm_alert_ok enable row level security;

-- Send an alert from the phone's place. Kinds: flood, fire, animal, missing, accident, storm, other.
create or replace function public.alert_send(p_kind text, p_body text, p_lat double precision, p_lon double precision)
returns json language plpgsql security definer set search_path = public, pg_temp as $$
declare me uuid := auth.uid(); k text := lower(cm_txt(p_kind, 20)); b text := cm_txt(p_body, 200); nid bigint;
        own boolean := lower(coalesce(auth.jwt() ->> 'email', '')) = 'asmaulsheikh47364@gmail.com';
begin
  if me is null then return json_build_object('ok', false, 'why', 'login'); end if;
  if k not in ('flood', 'fire', 'animal', 'missing', 'accident', 'storm', 'other') then return json_build_object('ok', false, 'why', 'kind'); end if;
  if length(b) < 3 then return json_build_object('ok', false, 'why', 'text'); end if;
  if not cm_ok_place(p_lat, p_lon) then return json_build_object('ok', false, 'why', 'place'); end if;
  if not own and exists (select 1 from cm_alerts where uid = me and at > now() - interval '10 minutes') then return json_build_object('ok', false, 'why', 'wait'); end if;
  if not cm_hit(me, 'alert_send', 3) then return json_build_object('ok', false, 'why', 'limit'); end if;    -- at most 3 alerts a day
  delete from cm_alerts where expires < now() - interval '1 day';
  insert into cm_alerts (expires, uid, kind, body, lat, lon, owner_ok)
    values (now() + case when k = 'missing' then interval '24 hours' else interval '6 hours' end, me, k, b, p_lat, p_lon, own)
    returning id into nid;
  return json_build_object('ok', true, 'id', nid, 'confirmed', own);
end $$;

-- Alerts within 5 km that have not expired. Never says who sent it or the exact place, only the distance.
create or replace function public.alert_nearby(p_lat double precision, p_lon double precision)
returns json language plpgsql security definer set search_path = public, pg_temp as $$
declare me uuid := auth.uid();
begin
  if me is null then return json_build_object('ok', false, 'why', 'login'); end if;
  if not cm_ok_place(p_lat, p_lon) then return json_build_object('ok', false, 'why', 'place'); end if;
  if not cm_hit(me, 'alert_nearby', 400) then return json_build_object('ok', false, 'why', 'limit'); end if;
  return json_build_object('ok', true, 'rows', coalesce((
    select json_agg(r order by r.at desc) from (
      select a.id, a.kind, a.body, a.at, a.expires,
             round(cm_km(p_lat, p_lon, a.lat, a.lon)::numeric, 1) as km,
             (select count(*) from cm_alert_ok o where o.alert_id = a.id) as confirms,
             (a.owner_ok or (select count(*) from cm_alert_ok o where o.alert_id = a.id) >= 2) as confirmed,
             (a.uid = me) as mine,
             exists (select 1 from cm_alert_ok o where o.alert_id = a.id and o.uid = me) as i_confirmed
      from cm_alerts a
      where a.expires > now() and a.lat between p_lat - 0.05 and p_lat + 0.05 and cm_km(p_lat, p_lon, a.lat, a.lon) <= 5
      order by a.at desc limit 20) r), '[]'::json));
end $$;

-- Another user within 5 km says the alert is true. Two such users make it confirmed.
create or replace function public.alert_confirm(p_id bigint, p_lat double precision, p_lon double precision)
returns json language plpgsql security definer set search_path = public, pg_temp as $$
declare me uuid := auth.uid(); a cm_alerts; n int;
begin
  if me is null then return json_build_object('ok', false, 'why', 'login'); end if;
  if not cm_ok_place(p_lat, p_lon) then return json_build_object('ok', false, 'why', 'place'); end if;
  select * into a from cm_alerts where id = p_id and expires > now();
  if not found then return json_build_object('ok', false, 'why', 'gone'); end if;
  if a.uid = me then return json_build_object('ok', false, 'why', 'own'); end if;
  if cm_km(p_lat, p_lon, a.lat, a.lon) > 5 then return json_build_object('ok', false, 'why', 'far'); end if;
  if not cm_hit(me, 'alert_confirm', 20) then return json_build_object('ok', false, 'why', 'limit'); end if;
  insert into cm_alert_ok (alert_id, uid) values (p_id, me) on conflict do nothing;
  select count(*) into n from cm_alert_ok where alert_id = p_id;
  return json_build_object('ok', true, 'confirms', n, 'confirmed', a.owner_ok or n >= 2);
end $$;

-- The sender takes back his own alert (for a mistake).
create or replace function public.alert_cancel(p_id bigint)
returns json language plpgsql security definer set search_path = public, pg_temp as $$
declare me uuid := auth.uid();
begin
  if me is null then return json_build_object('ok', false, 'why', 'login'); end if;
  delete from cm_alerts where id = p_id and uid = me;
  return json_build_object('ok', found);
end $$;

revoke all on function public.alert_send(text, text, double precision, double precision) from public, anon;
revoke all on function public.alert_nearby(double precision, double precision) from public, anon;
revoke all on function public.alert_confirm(bigint, double precision, double precision) from public, anon;
revoke all on function public.alert_cancel(bigint) from public, anon;
grant execute on function public.alert_send(text, text, double precision, double precision) to authenticated;
grant execute on function public.alert_nearby(double precision, double precision) to authenticated;
grant execute on function public.alert_confirm(bigint, double precision, double precision) to authenticated;
grant execute on function public.alert_cancel(bigint) to authenticated;

-- ---------- 2. family link ----------
create table if not exists public.cm_fam (id bigserial primary key, created timestamptz not null default now());
alter table public.cm_fam enable row level security;
create table if not exists public.cm_fam_member (
  uid uuid primary key,
  mid bigserial unique,
  fid bigint not null references public.cm_fam (id) on delete cascade,
  name text not null,
  joined timestamptz not null default now(),
  last_seen timestamptz not null default now(),
  care boolean not null default false
);
create index if not exists cm_fam_member_fid on public.cm_fam_member (fid);
alter table public.cm_fam_member enable row level security;
create table if not exists public.cm_fam_code (
  code text primary key,
  fid bigint not null references public.cm_fam (id) on delete cascade,
  expires timestamptz not null
);
alter table public.cm_fam_code enable row level security;
create table if not exists public.cm_fam_msg (
  id bigserial primary key,
  fid bigint not null references public.cm_fam (id) on delete cascade,
  from_uid uuid not null,
  from_name text not null,
  kind text not null,
  body text not null,
  at timestamptz not null default now()
);
create index if not exists cm_fam_msg_fid on public.cm_fam_msg (fid, id);
alter table public.cm_fam_msg enable row level security;

-- Members of a family (names, how long since each phone was last seen); never phone numbers or e-mails.
create or replace function public.cm_fam_list(p_fid bigint, p_me uuid)
returns json language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce(json_agg(json_build_object('mid', m.mid, 'name', m.name, 'me', m.uid = p_me, 'care', m.care,
           'silent_h', round((extract(epoch from now() - m.last_seen) / 3600)::numeric, 1)) order by m.joined), '[]'::json)
  from cm_fam_member m where m.fid = p_fid
$$;
revoke all on function public.cm_fam_list(bigint, uuid) from public, anon, authenticated;

-- Removes a user from his family; a family with nobody left is deleted with its codes and messages.
create or replace function public.cm_fam_out(p_me uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare f bigint;
begin
  delete from cm_fam_member where uid = p_me returning fid into f;
  if f is not null and not exists (select 1 from cm_fam_member where fid = f) then delete from cm_fam where id = f; end if;
end $$;
revoke all on function public.cm_fam_out(uuid) from public, anon, authenticated;

-- A 6-digit code valid for 30 minutes; makes a new family for him if he has none.
create or replace function public.fl_code(p_name text)
returns json language plpgsql security definer set search_path = public, pg_temp as $$
declare me uuid := auth.uid(); f bigint; c text; nm text := coalesce(nullif(cm_txt(p_name, 30), ''), 'Member'); n int;
begin
  if me is null then return json_build_object('ok', false, 'why', 'login'); end if;
  if not cm_hit(me, 'fam_code', 10) then return json_build_object('ok', false, 'why', 'limit'); end if;
  delete from cm_fam_code where expires < now();
  select fid into f from cm_fam_member where uid = me;
  if f is null then
    insert into cm_fam default values returning id into f;
    insert into cm_fam_member (uid, fid, name) values (me, f, nm);
  else
    update cm_fam_member set name = nm, last_seen = now() where uid = me and nullif(cm_txt(p_name, 30), '') is not null;
  end if;
  select count(*) into n from cm_fam_member where fid = f;
  if n >= 5 then return json_build_object('ok', false, 'why', 'full'); end if;
  loop
    c := lpad((floor(random() * 1000000))::int::text, 6, '0');
    exit when not exists (select 1 from cm_fam_code where code = c);
  end loop;
  insert into cm_fam_code (code, fid, expires) values (c, f, now() + interval '30 minutes');
  return json_build_object('ok', true, 'code', c, 'members', cm_fam_list(f, me));
end $$;

-- Join with a code from another family phone (at most 5 members). Leaves his old family if he had one.
create or replace function public.fl_join(p_code text, p_name text)
returns json language plpgsql security definer set search_path = public, pg_temp as $$
declare me uuid := auth.uid(); f bigint; old bigint; c text := regexp_replace(coalesce(p_code, ''), '\D', '', 'g');
        nm text := coalesce(nullif(cm_txt(p_name, 30), ''), 'Member');
begin
  if me is null then return json_build_object('ok', false, 'why', 'login'); end if;
  if not cm_hit(me, 'fam_join', 10) then return json_build_object('ok', false, 'why', 'limit'); end if;   -- also stops code guessing
  if length(c) <> 6 then return json_build_object('ok', false, 'why', 'code'); end if;
  select fid into f from cm_fam_code where code = c and expires > now();
  if f is null then return json_build_object('ok', false, 'why', 'code'); end if;
  select fid into old from cm_fam_member where uid = me;
  if old = f then return json_build_object('ok', true, 'members', cm_fam_list(f, me)); end if;
  if (select count(*) from cm_fam_member where fid = f) >= 5 then return json_build_object('ok', false, 'why', 'full'); end if;
  if old is not null then perform cm_fam_out(me); end if;
  insert into cm_fam_member (uid, fid, name) values (me, f, nm);
  return json_build_object('ok', true, 'members', cm_fam_list(f, me));
end $$;

create or replace function public.fl_leave()
returns json language plpgsql security definer set search_path = public, pg_temp as $$
declare me uuid := auth.uid();
begin
  if me is null then return json_build_object('ok', false, 'why', 'login'); end if;
  perform cm_fam_out(me);
  return json_build_object('ok', true);
end $$;

-- Quiet "this phone is alive" ping (at most every 2 hours from the phone) with his Care check choice.
create or replace function public.fl_ping(p_care boolean)
returns json language plpgsql security definer set search_path = public, pg_temp as $$
declare me uuid := auth.uid(); f bigint;
begin
  if me is null then return json_build_object('ok', false, 'why', 'login'); end if;
  if not cm_hit(me, 'fam_ping', 100) then return json_build_object('ok', false, 'why', 'limit'); end if;
  update cm_fam_member set last_seen = now(), care = coalesce(p_care, false) where uid = me returning fid into f;
  -- members whose phones have been silent for 60 days are removed
  perform cm_fam_out(uid) from cm_fam_member where last_seen < now() - interval '60 days';
  return json_build_object('ok', true, 'in_family', f is not null);
end $$;

-- A short message to the family: msg (his words), care (answer to the care check), sos (with location link).
create or replace function public.fl_send(p_kind text, p_body text)
returns json language plpgsql security definer set search_path = public, pg_temp as $$
declare me uuid := auth.uid(); m cm_fam_member; k text := lower(cm_txt(p_kind, 10)); b text := cm_txt(p_body, 300); nid bigint;
begin
  if me is null then return json_build_object('ok', false, 'why', 'login'); end if;
  if k not in ('msg', 'care', 'sos') then return json_build_object('ok', false, 'why', 'kind'); end if;
  if length(b) < 1 then return json_build_object('ok', false, 'why', 'text'); end if;
  select * into m from cm_fam_member where uid = me;
  if not found then return json_build_object('ok', false, 'why', 'nofamily'); end if;
  if not cm_hit(me, 'fam_send', 40) then return json_build_object('ok', false, 'why', 'limit'); end if;
  insert into cm_fam_msg (fid, from_uid, from_name, kind, body) values (m.fid, me, m.name, k, b) returning id into nid;
  update cm_fam_member set last_seen = now() where uid = me;
  delete from cm_fam_msg where at < now() - interval '7 days';
  return json_build_object('ok', true, 'id', nid, 'others', (select count(*) from cm_fam_member where fid = m.fid and uid <> me));
end $$;

-- New family messages after p_since (from the others, last 2 days) and the member list.
create or replace function public.fl_poll(p_since bigint)
returns json language plpgsql security definer set search_path = public, pg_temp as $$
declare me uuid := auth.uid(); f bigint;
begin
  if me is null then return json_build_object('ok', false, 'why', 'login'); end if;
  if not cm_hit(me, 'fam_poll', 400) then return json_build_object('ok', false, 'why', 'limit'); end if;
  select fid into f from cm_fam_member where uid = me;
  if f is null then return json_build_object('ok', true, 'in_family', false, 'members', '[]'::json, 'msgs', '[]'::json, 'last_id', 0); end if;
  return json_build_object('ok', true, 'in_family', true, 'members', cm_fam_list(f, me),
    'last_id', coalesce((select max(id) from cm_fam_msg where fid = f), 0),
    'msgs', coalesce((select json_agg(r order by r.id) from (
        select id, from_name, kind, body, at from cm_fam_msg
        where fid = f and from_uid <> me and id > coalesce(p_since, 0) and at > now() - interval '2 days'
        order by id limit 30) r), '[]'::json));
end $$;

revoke all on function public.fl_code(text) from public, anon;
revoke all on function public.fl_join(text, text) from public, anon;
revoke all on function public.fl_leave() from public, anon;
revoke all on function public.fl_ping(boolean) from public, anon;
revoke all on function public.fl_send(text, text) from public, anon;
revoke all on function public.fl_poll(bigint) from public, anon;
grant execute on function public.fl_code(text) to authenticated;
grant execute on function public.fl_join(text, text) to authenticated;
grant execute on function public.fl_leave() to authenticated;
grant execute on function public.fl_ping(boolean) to authenticated;
grant execute on function public.fl_send(text, text) to authenticated;
grant execute on function public.fl_poll(bigint) to authenticated;

-- ---------- 3. work board ----------
-- Phone numbers are given to the other side only after the worker says yes to a job (the employer agreed by posting it).
create table if not exists public.cm_workers (
  uid uuid primary key,
  skill text not null,
  km int not null,
  lat double precision not null,
  lon double precision not null,
  phone text not null,
  at timestamptz not null default now(),
  seen timestamptz not null default now()
);
alter table public.cm_workers enable row level security;
create table if not exists public.cm_jobs (
  id bigserial primary key,
  uid uuid not null,
  skill text not null,
  many int not null,
  whenx text not null,
  lat double precision not null,
  lon double precision not null,
  phone text not null,
  at timestamptz not null default now(),
  expires timestamptz not null
);
create index if not exists cm_jobs_exp on public.cm_jobs (expires);
alter table public.cm_jobs enable row level security;
create table if not exists public.cm_job_yes (
  job_id bigint not null references public.cm_jobs (id) on delete cascade,
  worker uuid not null,
  at timestamptz not null default now(),
  primary key (job_id, worker)
);
alter table public.cm_job_yes enable row level security;

-- Indian mobile number: 10 digits starting 6-9 (a leading +91, 91 or 0 is dropped). Null when it is not one.
create or replace function public.cm_phone(p text)
returns text language sql immutable set search_path = public, pg_temp as $$
  select case when d ~ '^[6-9][0-9]{9}$' then d else null end
  from (select regexp_replace(regexp_replace(coalesce(p, ''), '\D', '', 'g'), '^(91|0)(?=[6-9][0-9]{9}$)', '') as d) x
$$;
revoke all on function public.cm_phone(text) from public, anon, authenticated;

-- Same work? "raj mistri" matches "mistri", "majdoor" matches "majdoor".
create or replace function public.cm_same_skill(a text, b text)
returns boolean language sql immutable set search_path = public, pg_temp as $$
  select length(btrim(a)) > 1 and length(btrim(b)) > 1 and (position(lower(btrim(a)) in lower(b)) > 0 or position(lower(btrim(b)) in lower(a)) > 0)
$$;
revoke all on function public.cm_same_skill(text, text) from public, anon, authenticated;

create or replace function public.work_register(p_skill text, p_km int, p_phone text, p_lat double precision, p_lon double precision)
returns json language plpgsql security definer set search_path = public, pg_temp as $$
declare me uuid := auth.uid(); s text := lower(cm_txt(p_skill, 40)); ph text := cm_phone(p_phone);
begin
  if me is null then return json_build_object('ok', false, 'why', 'login'); end if;
  if length(s) < 2 then return json_build_object('ok', false, 'why', 'skill'); end if;
  if p_km is null or p_km < 1 or p_km > 50 then return json_build_object('ok', false, 'why', 'km'); end if;
  if ph is null then return json_build_object('ok', false, 'why', 'phone'); end if;
  if not cm_ok_place(p_lat, p_lon) then return json_build_object('ok', false, 'why', 'place'); end if;
  if not cm_hit(me, 'work_register', 10) then return json_build_object('ok', false, 'why', 'limit'); end if;
  insert into cm_workers (uid, skill, km, lat, lon, phone) values (me, s, p_km, p_lat, p_lon, ph)
    on conflict (uid) do update set skill = excluded.skill, km = excluded.km, lat = excluded.lat, lon = excluded.lon, phone = excluded.phone, at = now(), seen = now();
  return json_build_object('ok', true);
end $$;

create or replace function public.work_stop()
returns json language plpgsql security definer set search_path = public, pg_temp as $$
declare me uuid := auth.uid();
begin
  if me is null then return json_build_object('ok', false, 'why', 'login'); end if;
  delete from cm_workers where uid = me;
  return json_build_object('ok', found);
end $$;

-- Post a job at the employer's place; ends after 48 hours.
create or replace function public.work_need(p_skill text, p_many int, p_when text, p_phone text, p_lat double precision, p_lon double precision)
returns json language plpgsql security definer set search_path = public, pg_temp as $$
declare me uuid := auth.uid(); s text := lower(cm_txt(p_skill, 40)); w text := cm_txt(p_when, 60); ph text := cm_phone(p_phone); nid bigint;
begin
  if me is null then return json_build_object('ok', false, 'why', 'login'); end if;
  if length(s) < 2 then return json_build_object('ok', false, 'why', 'skill'); end if;
  if p_many is null or p_many < 1 or p_many > 50 then return json_build_object('ok', false, 'why', 'many'); end if;
  if length(w) < 2 then return json_build_object('ok', false, 'why', 'when'); end if;
  if ph is null then return json_build_object('ok', false, 'why', 'phone'); end if;
  if not cm_ok_place(p_lat, p_lon) then return json_build_object('ok', false, 'why', 'place'); end if;
  if (select count(*) from cm_jobs where uid = me and expires > now()) >= 5 then return json_build_object('ok', false, 'why', 'open'); end if;
  if not cm_hit(me, 'work_need', 5) then return json_build_object('ok', false, 'why', 'limit'); end if;
  delete from cm_jobs where expires < now() - interval '1 day';
  insert into cm_jobs (uid, skill, many, whenx, lat, lon, phone, expires) values (me, s, p_many, w, p_lat, p_lon, ph, now() + interval '48 hours')
    returning id into nid;
  return json_build_object('ok', true, 'id', nid);
end $$;

create or replace function public.work_remove_job(p_id bigint)
returns json language plpgsql security definer set search_path = public, pg_temp as $$
declare me uuid := auth.uid();
begin
  if me is null then return json_build_object('ok', false, 'why', 'login'); end if;
  delete from cm_jobs where id = p_id and uid = me;
  return json_build_object('ok', found);
end $$;

-- Everything for this user: his registration, open jobs that match it (the employer's number only for jobs he said yes to),
-- and his own posts with the workers who said yes (their numbers).
create or replace function public.work_poll()
returns json language plpgsql security definer set search_path = public, pg_temp as $$
declare me uuid := auth.uid(); w cm_workers;
begin
  if me is null then return json_build_object('ok', false, 'why', 'login'); end if;
  if not cm_hit(me, 'work_poll', 400) then return json_build_object('ok', false, 'why', 'limit'); end if;
  delete from cm_workers where seen < now() - interval '60 days';
  update cm_workers set seen = now() where uid = me returning * into w;
  return json_build_object('ok', true,
    'me', case when w.uid is null then null else json_build_object('skill', w.skill, 'km', w.km, 'phone', w.phone) end,
    'jobs', case when w.uid is null then '[]'::json else coalesce((
      select json_agg(r order by r.at desc) from (
        select j.id, j.skill, j.many, j.whenx, j.at, j.expires, round(cm_km(w.lat, w.lon, j.lat, j.lon)::numeric, 1) as km,
               (y.worker is not null) as accepted, case when y.worker is not null then j.phone else null end as phone
        from cm_jobs j left join cm_job_yes y on y.job_id = j.id and y.worker = me
        where j.expires > now() and j.uid <> me and cm_same_skill(j.skill, w.skill)
          and j.lat between w.lat - w.km / 110.0 and w.lat + w.km / 110.0 and cm_km(w.lat, w.lon, j.lat, j.lon) <= w.km
        order by j.at desc limit 20) r), '[]'::json) end,
    'posts', coalesce((
      select json_agg(r order by r.at desc) from (
        select j.id, j.skill, j.many, j.whenx, j.at, j.expires,
               coalesce((select json_agg(json_build_object('skill', k.skill, 'phone', k.phone, 'at', y.at) order by y.at)
                         from cm_job_yes y join cm_workers k on k.uid = y.worker where y.job_id = j.id), '[]'::json) as yes
        from cm_jobs j where j.uid = me and j.expires > now() order by j.at desc limit 10) r), '[]'::json));
end $$;

-- The worker says yes to a matching job: only now he gets the employer's number (and the employer gets his).
create or replace function public.work_yes(p_id bigint)
returns json language plpgsql security definer set search_path = public, pg_temp as $$
declare me uuid := auth.uid(); w cm_workers; j cm_jobs;
begin
  if me is null then return json_build_object('ok', false, 'why', 'login'); end if;
  select * into w from cm_workers where uid = me;
  if not found then return json_build_object('ok', false, 'why', 'notworker'); end if;
  select * into j from cm_jobs where id = p_id and expires > now();
  if not found then return json_build_object('ok', false, 'why', 'gone'); end if;
  if j.uid = me then return json_build_object('ok', false, 'why', 'own'); end if;
  if not cm_same_skill(j.skill, w.skill) or cm_km(w.lat, w.lon, j.lat, j.lon) > w.km then return json_build_object('ok', false, 'why', 'nomatch'); end if;
  if not exists (select 1 from cm_job_yes where job_id = p_id and worker = me) then
    if (select count(*) from cm_job_yes where job_id = p_id) >= 20 then return json_build_object('ok', false, 'why', 'full'); end if;
    if not cm_hit(me, 'work_yes', 20) then return json_build_object('ok', false, 'why', 'limit'); end if;
    insert into cm_job_yes (job_id, worker) values (p_id, me);
  end if;
  return json_build_object('ok', true, 'phone', j.phone, 'skill', j.skill, 'whenx', j.whenx);
end $$;

revoke all on function public.work_register(text, int, text, double precision, double precision) from public, anon;
revoke all on function public.work_stop() from public, anon;
revoke all on function public.work_need(text, int, text, text, double precision, double precision) from public, anon;
revoke all on function public.work_remove_job(bigint) from public, anon;
revoke all on function public.work_poll() from public, anon;
revoke all on function public.work_yes(bigint) from public, anon;
grant execute on function public.work_register(text, int, text, double precision, double precision) to authenticated;
grant execute on function public.work_stop() to authenticated;
grant execute on function public.work_need(text, int, text, text, double precision, double precision) to authenticated;
grant execute on function public.work_remove_job(bigint) to authenticated;
grant execute on function public.work_poll() to authenticated;
grant execute on function public.work_yes(bigint) to authenticated;
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
print("DATABASE", q(open("community.sql", encoding="utf-8").read())[0])
print("CHECK", q("select proname from pg_proc where proname in ('alert_cancel','alert_confirm','alert_nearby','alert_send','fl_code','fl_join','fl_leave','fl_ping','fl_poll','fl_send','work_need','work_poll','work_register','work_remove_job','work_stop','work_yes') order by 1")[1])
PY
[ $? -eq 0 ] && echo "=== TAIYAR: gaon alert, parivar link aur kaam board ki jagah ban gayi ===" || echo "=== Kuch step fail hua, upar ka error bhejo ==="
