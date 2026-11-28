#!/data/data/com.termux/files/usr/bin/bash
# Payal: when the Winter Offer ends (30 Nov midnight India time), the Christmas and New Year Offer starts by itself
# with the same prices; the real price starts only after 1 Jan 2027 11:59 pm India time. Safe to run again.
REF=hwfifqyssabwwdjlbqty
command -v python3 >/dev/null || pkg install -y python
mkdir -p ~/payal-db/offer && cd ~/payal-db/offer
cat > offer.sql <<'SQLEOF'
create extension if not exists pg_cron with schema pg_catalog;
-- 18:30 UTC on 30 Nov = 12:00 midnight India time: keep the offer prices, only the offer name changes.
select cron.unschedule(jobid) from cron.job where jobname in ('payal-offer-end', 'payal-offer-next', 'payal-offer-end2');
select cron.schedule('payal-offer-next', '30 18 30 11 *',
  $job$update public.plans set offer_hi = 'क्रिसमस और नए साल का ऑफ़र', offer_en = 'Christmas and New Year Offer' where id in ('plus', 'pro');
       select cron.unschedule(jobid) from cron.job where jobname = 'payal-offer-next';$job$);
-- 18:30 UTC on 1 Jan = 12:00 midnight India time: the offer is over, the real price starts.
select cron.schedule('payal-offer-end2', '30 18 1 1 *',
  $job$update public.plans set price = mrp, offer_hi = '', offer_en = '' where id in ('plus', 'pro') and mrp > price;
       select cron.unschedule(jobid) from cron.job where jobname = 'payal-offer-end2';$job$);
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
print("DATABASE", q(open("offer.sql", encoding="utf-8").read())[0])
print("JOBS", q("select jobname, schedule from cron.job where jobname like 'payal-offer%' order by 1")[1])
print("PRICES", q("select id, price, mrp, offer_en from public.plans order by id")[1])
PY
[ $? -eq 0 ] && echo "=== TAIYAR: agla offer apne aap lagega ===" || echo "=== Kuch step fail hua, upar ka error bhejo ==="
