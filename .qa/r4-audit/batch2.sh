#!/bin/bash
# Batch 2: research pages + missed phone checks + keyboard pass.
cd /home/z/asdri-platform
LOG=/home/z/asdri-platform/.qa/r4-audit/dev-batch2.log
AB="agent-browser --session audit-cms"

DATABASE_URL="postgresql://asdri@127.0.0.1:5433/asdri_dev?schema=public" \
NEXT_PUBLIC_SITE_URL="http://localhost:3000" \
node /home/z/asdri-platform/node_modules/.bin/next dev -p 3000 >> "$LOG" 2>&1 &
SRV=$!
for i in $(seq 1 60); do
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 http://127.0.0.1:3000/admin 2>/dev/null)
  if [ "$code" != "000" ] && [ "$code" != "" ]; then echo "ready (code $code)"; break; fi
  sleep 2
done

for route in projects publications downloads; do
  echo "===== ROUTE: /admin/research/$route (desktop) ====="
  $AB set viewport 1440 900 >/dev/null 2>&1
  $AB console --clear >/dev/null 2>&1; $AB errors --clear >/dev/null 2>&1
  $AB open "http://127.0.0.1:3000/admin/research/$route" 2>&1 | head -2
  $AB wait --load networkidle >/dev/null 2>&1; sleep 2
  echo "--- interactive snapshot ---"
  $AB snapshot -i 2>&1 | grep -vE "navigation \"অ্যাডমিন|link \"(ড্যাশবোর্ড|নোটিশ বোর্ড|কোর্স ও|শিক্ষক ও|ব্লগ ও|গ্যালারি|ভিডিও|গবেষণা|ফতোয়া|ভর্তি ব্য|আর্থিক|পেজ কন|মিডিয়া লাই|বার্তা ও|ইউজার ও|অডিট লগ|সাইট সেটি|ওয়েবসাইট দেখুন|অ্যাডমিন প্যানেল)|option " | head -55
  echo "--- errors ---"
  $AB errors 2>&1 | head -5
  echo "--- phone 390 ---"
  $AB set viewport 390 844 >/dev/null 2>&1
  echo -n "scrollWidth: "; $AB eval "document.documentElement.scrollWidth" 2>&1
  $AB screenshot "/home/z/asdri-platform/.qa/r4-audit/cms-research-$route-phone.png" >/dev/null 2>&1
done

echo "===== missed phone checks ====="
$AB set viewport 390 844 >/dev/null 2>&1
$AB open "http://127.0.0.1:3000/admin/courses" >/dev/null 2>&1; $AB wait --load networkidle >/dev/null 2>&1; sleep 1.5
echo -n "courses-list phone: "; $AB eval "document.documentElement.scrollWidth" 2>&1
$AB open "http://127.0.0.1:3000/admin/blog/allah-existence-rational-foundations" >/dev/null 2>&1; $AB wait --load networkidle >/dev/null 2>&1; sleep 1.5
echo -n "blog-edit phone: "; $AB eval "document.documentElement.scrollWidth" 2>&1
$AB open "http://127.0.0.1:3000/admin/notices/new" >/dev/null 2>&1; $AB wait --load networkidle >/dev/null 2>&1; sleep 1.5
echo -n "notices-new phone: "; $AB eval "document.documentElement.scrollWidth" 2>&1
$AB set viewport 1440 900 >/dev/null 2>&1

echo "===== keyboard pass: /admin/notices (Tab x20) ====="
$AB open "http://127.0.0.1:3000/admin/notices" >/dev/null 2>&1; $AB wait --load networkidle >/dev/null 2>&1; sleep 1
$AB eval "document.activeElement.tagName + '|' + (document.activeElement.getAttribute('aria-label')||document.activeElement.textContent.trim().slice(0,30)||'')" 2>&1
for i in $(seq 1 20); do $AB press Tab >/dev/null 2>&1; done
$AB eval "document.activeElement.tagName + '|' + (document.activeElement.getAttribute('aria-label')||document.activeElement.textContent.trim().slice(0,30)||'')" 2>&1
echo "--- focus outline check on focused element ---"
$AB eval "(() => { const el=document.activeElement; const s=getComputedStyle(el); return 'outline='+s.outlineStyle+'/'+s.outlineWidth+' boxShadow='+s.boxShadow.slice(0,60)+' ring='+(el.className.includes('ring')?'yes':'no') })()" 2>&1
echo "--- keyboard: reach the filter/search? focus list ---"
$AB find role textbox focus --name "শিরোনাম দিয়ে খুঁজুন…" >/dev/null 2>&1
$AB eval "document.activeElement.tagName" 2>&1

echo "===== keyboard pass 2: dashboard Tab from start ====="
$AB open "http://127.0.0.1:3000/admin" >/dev/null 2>&1; $AB wait --load networkidle >/dev/null 2>&1; sleep 1
for i in $(seq 1 25); do $AB press Tab >/dev/null 2>&1; done
$AB eval "document.activeElement.tagName + '|' + (document.activeElement.getAttribute('aria-label')||document.activeElement.textContent.trim().slice(0,30)||'')" 2>&1

echo "===== BATCH2 COMPLETE ====="
kill $SRV 2>/dev/null; wait $SRV 2>/dev/null
echo done
