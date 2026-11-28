#!/data/data/com.termux/files/usr/bin/bash
# Payal: read-only check of the payment server code (function "pay"): shows only the lines that decide the amount.
# Nothing is changed. Safe to run again.
REF=hwfifqyssabwwdjlbqty
mkdir -p ~/payal-db/paycheck && cd ~/payal-db/paycheck
echo "Supabase access token paste karo (sbp_ se shuru, dikhega nahi), phir Enter:"
read -s TOK
echo ""
TOK=$(echo "$TOK" | grep -o 'sbp_[A-Za-z0-9_]*' | head -1)
[ -n "$TOK" ] || { echo "Token nahi mila: sbp_ se shuru hone wala token paste karo"; exit 1; }
curl -s -o list.json -H "Authorization: Bearer $TOK" -H "User-Agent: curl/8.5.0" "https://api.supabase.com/v1/projects/$REF/functions"
echo "FUNCTIONS: $(grep -o '"slug":"[^"]*"' list.json | tr '\n' ' ')"
curl -s -o pay.body -H "Authorization: Bearer $TOK" -H "User-Agent: curl/8.5.0" "https://api.supabase.com/v1/projects/$REF/functions/pay/body"
echo "SIZE: $(wc -c < pay.body)"
echo "--- amount lines ---"
grep -a -n -i -E "amount|from\(.plans.|\.price|mrp|currency|orders" pay.body | cut -c1-220 | head -30
echo "=== CHECK PURA ==="
