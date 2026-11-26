#!/data/data/com.termux/files/usr/bin/bash
# Payal Chat: free CC BY music for stories (Kevin MacLeod, incompetech.com), with credits. Safe to run again.
REF=hwfifqyssabwwdjlbqty
command -v python3 >/dev/null || pkg install -y python
mkdir -p ~/payal-db/music && cd ~/payal-db/music
cat > part.sql <<'SQLEOF'
-- ===================== part 1d (2026-11-26): others' free music (with credit), own song from phone, story report, file cleanup =====================
do $$ begin
  if exists (select 1 from pg_namespace where nspname = 'storage') then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
      values ('paudio', 'paudio', true, 5242880, array['audio/mpeg','audio/mp3','audio/mp4','audio/x-m4a','audio/aac','audio/ogg','audio/opus','audio/wav','audio/x-wav','audio/3gpp','audio/amr','audio/flac'])
      on conflict (id) do update set public = true, file_size_limit = 5242880,
        allowed_mime_types = array['audio/mpeg','audio/mp3','audio/mp4','audio/x-m4a','audio/aac','audio/ogg','audio/opus','audio/wav','audio/x-wav','audio/3gpp','audio/amr','audio/flac'];
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
      values ('pmusic', 'pmusic', true, 15728640, array['audio/mpeg','application/json'])
      on conflict (id) do update set public = true, file_size_limit = 15728640, allowed_mime_types = array['audio/mpeg','application/json'];
    drop policy if exists paudio_insert on storage.objects;
    create policy paudio_insert on storage.objects for insert to authenticated
      with check (bucket_id = 'paudio' and (storage.foldername(name))[1] = auth.uid()::text);
    drop policy if exists paudio_delete on storage.objects;
    create policy paudio_delete on storage.objects for delete to authenticated
      using (bucket_id = 'paudio' and (storage.foldername(name))[1] = auth.uid()::text);
  end if;
end $$;

alter table public.msg_story add column if not exists music text not null default '';

-- stories are no longer bulk-deleted here; each owner's app removes its old stories with their files (msg_old_files)
create or replace function public.msg_story_add(p_kind text, p_url text, p_text text, p_bg text)
returns json language plpgsql security definer set search_path = public, pg_temp as $$
declare me uuid := auth.uid(); nid bigint;
begin
  if me is null then return json_build_object('error', 'login'); end if;
  if not exists (select 1 from msg_profile where uid = me) then return json_build_object('error', 'join'); end if;
  if p_kind not in ('photo', 'text') then return json_build_object('error', 'kind'); end if;
  if p_kind = 'photo' and (coalesce(p_url, '') = '' or not msg_okurl(p_url, me)) then return json_build_object('error', 'url'); end if;
  if p_kind = 'text' and length(msg_txt(p_text, 300)) = 0 then return json_build_object('error', 'text'); end if;
  if not cm_hit(me, 'msg_story', 25) then return json_build_object('error', 'limit'); end if;
  insert into msg_story (uid, kind, url, txt, bg) values (me, p_kind, coalesce(p_url, ''), msg_txt(p_text, 300), left(coalesce(p_bg, ''), 12)) returning id into nid;
  return json_build_object('ok', true, 'id', nid);
end $$;

create table if not exists public.msg_story_report (story bigint not null, reporter uuid not null, at timestamptz not null default now(), primary key (story, reporter));
alter table public.msg_story_report enable row level security;

create or replace function public.msg_musicok(p_url text, p_uid uuid)
returns boolean language sql immutable set search_path = public, pg_temp as $$
  select coalesce(p_url, '') = ''
    or p_url ~ '^https://payalapp\.in/music/t[0-9]+\.mp3$'
    or p_url like 'https://hwfifqyssabwwdjlbqty.supabase.co/storage/v1/object/public/pmusic/%'
    or p_url like 'https://hwfifqyssabwwdjlbqty.supabase.co/storage/v1/object/public/paudio/' || p_uid::text || '/%'
$$;
revoke all on function public.msg_musicok(text, uuid) from public, anon, authenticated;

create or replace function public.msg_story_add2(p_kind text, p_url text, p_text text, p_bg text, p_music text)
returns json language plpgsql security definer set search_path = public, pg_temp as $$
declare r json; nid bigint;
begin
  if not msg_musicok(p_music, auth.uid()) then return json_build_object('error', 'music'); end if;
  r := msg_story_add(p_kind, p_url, p_text, p_bg);
  nid := (r ->> 'id')::bigint;
  if nid is not null and coalesce(p_music, '') <> '' then
    update msg_story set music = left(p_music, 300) where id = nid and uid = auth.uid();
  end if;
  return r;
end $$;

-- files of my story that live in my own folders (photo and my own song); other music is shared and never deleted
create or replace function public.msg_story_files(s public.msg_story)
returns text[] language sql immutable set search_path = public, pg_temp as $$
  select array_remove(array[
    case when s.url like 'https://hwfifqyssabwwdjlbqty.supabase.co/storage/v1/object/public/pchat/' || s.uid::text || '/s\_%'
      then substr(s.url, length('https://hwfifqyssabwwdjlbqty.supabase.co/storage/v1/object/public/') + 1) end,
    case when s.music like 'https://hwfifqyssabwwdjlbqty.supabase.co/storage/v1/object/public/paudio/' || s.uid::text || '/%'
      then substr(s.music, length('https://hwfifqyssabwwdjlbqty.supabase.co/storage/v1/object/public/') + 1) end], null)
$$;
revoke all on function public.msg_story_files(public.msg_story) from public, anon, authenticated;

create or replace function public.msg_story_delete(p_id bigint)
returns json language plpgsql security definer set search_path = public, pg_temp as $$
declare f text[] := '{}'; s msg_story;
begin
  select * into s from msg_story where id = p_id and uid = auth.uid();
  if found then
    f := msg_story_files(s);
    delete from msg_story_seen where story = p_id;
    delete from msg_story_report where story = p_id;
    delete from msg_story where id = p_id;
  end if;
  return json_build_object('ok', true, 'files', to_json(f));
end $$;

-- my stories older than a day: removed, and their files handed back to the app to delete from the store
create or replace function public.msg_old_files()
returns json language plpgsql security definer set search_path = public, pg_temp as $$
declare me uuid := auth.uid(); f text[] := '{}'; s msg_story;
begin
  if me is null then return json_build_object('error', 'login'); end if;
  for s in select * from msg_story where uid = me and at < now() - interval '25 hours' loop
    f := f || msg_story_files(s);
    delete from msg_story_seen where story = s.id;
    delete from msg_story_report where story = s.id;
    delete from msg_story where id = s.id;
  end loop;
  return json_build_object('ok', true, 'files', to_json(f));
end $$;

create or replace function public.msg_story_report_it(p_id bigint)
returns json language plpgsql security definer set search_path = public, pg_temp as $$
declare me uuid := auth.uid();
begin
  if me is null then return json_build_object('error', 'login'); end if;
  if not exists (select 1 from msg_story s where s.id = p_id and s.uid <> me
      and exists (select 1 from msg_friend f where f.a = least(me, s.uid) and f.b = greatest(me, s.uid) and f.state = 'ok')) then
    return json_build_object('error', 'story'); end if;
  if not cm_hit(me, 'msg_story_report', 30) then return json_build_object('error', 'limit'); end if;
  insert into msg_story_report (story, reporter) values (p_id, me) on conflict do nothing;
  return json_build_object('ok', true);
end $$;

create or replace function public.msg_stories()
returns json language plpgsql security definer set search_path = public, pg_temp as $$
declare me uuid := auth.uid(); res json;
begin
  if me is null then return json_build_object('error', 'login'); end if;
  with people as (
    select me as u union
    select case when a = me then b else a end from msg_friend where state = 'ok' and (a = me or b = me)
  ), st as (
    select s.*, exists (select 1 from msg_story_seen v where v.story = s.id and v.viewer = me) as viewed,
      (select count(*) from msg_story_seen v where v.story = s.id) as views
    from msg_story s join people p on p.u = s.uid
    where s.at > now() - interval '24 hours' and not msg_blocked(me, s.uid)
      and (s.uid = me or (not exists (select 1 from msg_story_report r where r.story = s.id and r.reporter = me)
                          and (select count(*) from msg_story_report r where r.story = s.id) < 3))
  )
  select coalesce(json_agg(g order by g.mine desc, g.all_viewed, g.last_at desc), '[]'::json) into res from (
    select (st.uid = me) as mine, msg_card(p) as card, bool_and(st.viewed or st.uid = me) as all_viewed, max(st.at) as last_at,
      json_agg(json_build_object('id', st.id, 'kind', st.kind, 'url', st.url, 'text', st.txt, 'bg', st.bg, 'music', st.music, 'at', st.at, 'viewed', st.viewed,
        'views', case when st.uid = me then st.views else null end) order by st.id) as items
    from st join msg_profile p on p.uid = st.uid
    group by st.uid, p.uid) g;
  return json_build_object('items', res);
end $$;

do $$ declare f text; begin
  foreach f in array array['msg_story_add2(text,text,text,text,text)','msg_story_delete(bigint)','msg_old_files()','msg_story_report_it(bigint)','msg_stories()'] loop
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
import sys, json, os, urllib.request, urllib.error, urllib.parse
tok, ref = sys.argv[1:3]
SUPA = "https://%s.supabase.co" % ref
UA = "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Mobile Safari/537.36"
def api(path, data=None, method="GET"):
    req = urllib.request.Request("https://api.supabase.com/v1/projects/%s/%s" % (ref, path), data=data, method=method,
        headers={"Authorization": "Bearer " + tok, "Content-Type": "application/json", "User-Agent": "curl/8.5.0"})
    try:
        r = urllib.request.urlopen(req, timeout=120); return r.status, r.read().decode("utf-8", "ignore")
    except urllib.error.HTTPError as e:
        print("ERROR", e.code, e.read().decode("utf-8", "ignore")[:400]); sys.exit(1)
print("DATABASE", api("database/query", json.dumps({"query": open("part.sql", encoding="utf-8").read()}).encode(), "POST")[0])
keys = json.loads(api("api-keys?reveal=true")[1])
key = next((k.get("api_key") for k in keys if k.get("name") == "service_role" and k.get("api_key")), None) \
   or next((k.get("api_key") for k in keys if k.get("type") == "secret" and k.get("api_key")), None)
if not key: print("ERROR: server ki chabi nahi mili"); sys.exit(1)
def put(name, data, ctype):
    h = {"apikey": key, "Content-Type": ctype, "x-upsert": "true", "User-Agent": "curl/8.5.0"}
    if key.startswith("eyJ"): h["Authorization"] = "Bearer " + key
    req = urllib.request.Request(SUPA + "/storage/v1/object/pmusic/" + name, data=data, method="POST", headers=h)
    try: urllib.request.urlopen(req, timeout=300); return True
    except urllib.error.HTTPError as e: print("  store said", e.code, e.read().decode("utf-8", "ignore")[:200]); return False
TRACKS = [
 ("Happy", "Carefree"), ("Happy", "Fluffing a Duck"), ("Happy", "Monkeys Spinning Monkeys"), ("Happy", "Life of Riley"),
 ("Happy", "Happy Alley"), ("Happy", "Wholesome"), ("Happy", "Easy Lemon"), ("Happy", "Merry Go"),
 ("Funny", "Sneaky Snitch"), ("Funny", "Scheming Weasel faster"), ("Funny", "Pixel Peeker Polka - faster"),
 ("Chill", "Airport Lounge"), ("Chill", "Lobby Time"), ("Chill", "Local Forecast - Elevator"), ("Chill", "Wallpaper"), ("Chill", "Sweeter Vermouth"),
 ("Peaceful", "Meditation Impromptu 01"), ("Peaceful", "Dreamer"), ("Peaceful", "Garden Music"), ("Peaceful", "Fretless"),
 ("Sad", "Heartbreaking"), ("Sad", "Lasting Hope"), ("Sad", "Sad Trio"), ("Sad", "The Snow Queen"),
 ("Mystery", "Investigations"), ("Mystery", "Cipher"), ("Mystery", "Midnight Tale"), ("Mystery", "Hidden Agenda"),
 ("Energy", "Call to Adventure"), ("Energy", "Hot Pursuit"),
 ("World", "Desert City"), ("World", "Ishikari Lore"), ("World", "Bumba Crossing"), ("World", "Thatched Villagers"), ("World", "Minstrel Guild"), ("World", "Master of the Feast"),
]
out = []
for i, (mood, title) in enumerate(TRACKS, 1):
    fid = "k%02d.mp3" % i
    src = "https://incompetech.com/music/royalty-free/mp3-royaltyfree/" + urllib.parse.quote(title) + ".mp3"
    print("[%d/%d] %s ..." % (i, len(TRACKS), title), flush=True)
    try:
        r = urllib.request.urlopen(urllib.request.Request(src, headers={"User-Agent": UA}), timeout=120)
        data = r.read()
        if len(data) < 100000 or not (data[:3] == b"ID3" or data[:2] in (b"\xff\xfb", b"\xff\xf3", b"\xff\xf2")):
            print("  chhoda (sahi gaana nahi mila)"); continue
        if len(data) > 15 * 1024 * 1024: print("  chhoda (bahut bada)"); continue
    except Exception as e:
        print("  chhoda (utra nahi:", type(e).__name__, ")"); continue
    if not put(fid, data, "audio/mpeg"): continue
    out.append({"id": fid[:-4], "title": title, "mood": mood, "artist": "Kevin MacLeod",
        "credit": title + " - Kevin MacLeod (incompetech.com) - CC BY 4.0",
        "credit_full": '"' + title + '" Kevin MacLeod (incompetech.com)\nLicensed under Creative Commons: By Attribution 4.0 License\nhttp://creativecommons.org/licenses/by/4.0/',
        "url": SUPA + "/storage/v1/object/public/pmusic/" + fid})
    print("  ho gaya", flush=True)
ok = put("list.json", json.dumps({"tracks": out}, ensure_ascii=False).encode("utf-8"), "application/json")
print("GAANE TAIYAR:", len(out), "of", len(TRACKS), "| list", "ok" if ok else "FAIL")
sys.exit(0 if ok and out else 1)
PY
[ $? -eq 0 ] && echo "=== TAIYAR: kahani ke liye muft gaane (naam ke saath) lag gaye ===" || echo "=== Kuch step fail hua, upar ka error bhejo ==="
