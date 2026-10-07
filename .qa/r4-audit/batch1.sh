#!/bin/bash
# Batch 1: restart dev server in-process, audit /admin/content/* at both widths.
cd /home/z/asdri-platform
LOG=/home/z/asdri-platform/.qa/r4-audit/dev-batch1.log
AB="agent-browser --session audit-cms"

DATABASE_URL="postgresql://asdri@127.0.0.1:5433/asdri_dev?schema=public" \
NEXT_PUBLIC_SITE_URL="http://localhost:3000" \
node /home/z/asdri-platform/node_modules/.bin/next dev -p 3000 >> "$LOG" 2>&1 &
SRV=$!
echo "server pid $SRV"

# wait for readiness (max 120s)
for i in $(seq 1 60); do
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 http://127.0.0.1:3000/admin 2>/dev/null)
  if [ "$code" != "000" ] && [ "$code" != "" ]; then echo "ready after ${i}x2s (code $code)"; break; fi
  sleep 2
done

for route in home faqs admission; do
  echo "===== ROUTE: /admin/content/$route (desktop) ====="
  $AB set viewport 1440 900 >/dev/null 2>&1
  $AB console --clear >/dev/null 2>&1; $AB errors --clear >/dev/null 2>&1
  $AB open "http://127.0.0.1:3000/admin/content/$route" 2>&1 | head -2
  $AB wait --load networkidle >/dev/null 2>&1; sleep 2
  echo "--- snapshot (headings/buttons/switches/textboxes) ---"
  $AB snapshot -i 2>&1 | grep -vE "navigation \"অ্যাডমিন|link \"(ড্যাশবোর্ড|নোটিশ বোর্ড|কোর্স ও|শিক্ষক ও|ব্লগ ও|গ্যালারি|ভিডিও|গবেষণা|ফতোয়া|ভর্তি ব্য|আর্থিক|পেজ কন|মিডিয়া লাই|বার্তা ও|ইউজার ও|অডিট লগ|সাইট সেটি|ওয়েবসাইট দেখুন|অ্যাডমিন প্যানেল)|option |button \"(বোল্ড|ইটালিক|স্ট্রাইক|শিরোনাম|বুলেট|নম্বর|উদ্ধৃতি|লিংক|আনডু|রিডু)" | head -70
  echo "--- errors ---"
  $AB errors 2>&1 | head -6
  echo "--- phone 390 ---"
  $AB set viewport 390 844 >/dev/null 2>&1
  echo -n "scrollWidth: "; $AB eval "document.documentElement.scrollWidth" 2>&1
  $AB screenshot "/home/z/asdri-platform/.qa/r4-audit/cms-content-$route-phone.png" >/dev/null 2>&1
done

echo "===== done, killing server ====="
kill $SRV 2>/dev/null
wait $SRV 2>/dev/null
echo "BATCH1 COMPLETE"
