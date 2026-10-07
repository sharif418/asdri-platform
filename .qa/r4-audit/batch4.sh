#!/bin/bash
# Batch 4: verify prior-instance claims live (preview-link 404s, Bangla slug 409), clean up test notices.
cd /home/z/asdri-platform
LOG=/home/z/asdri-platform/.qa/r4-audit/dev-batch4.log
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

echo "===== H1 preview-link targets (unauthenticated curl → expect 200 redirect chain or 404) ====="
for u in "/notices?notice=notice" "/media/blog/allah-existence-rational-foundations" "/media/gallery" "/media/videos" "/about/leadership" "/research/publications" "/research/projects" "/academics/courses/preparatory-year-for-specialization" "/bn/notices" "/bn/media/blog/allah-existence-rational-foundations"; do
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 60 "http://127.0.0.1:3000$u")
  echo "$u -> $code"
done

echo "===== C2: create Bangla-only notice (expect slug conflict) ====="
$AB set viewport 1440 900 >/dev/null 2>&1
$AB open "http://127.0.0.1:3000/admin/notices/new" >/dev/null 2>&1; $AB wait --load networkidle >/dev/null 2>&1; sleep 1.5
TITLE_BOX=$($AB snapshot -i 2>&1 | grep -m1 'textbox "বাংলা শিরোনাম লিখুন"' | grep -oE 'e[0-9]+')
echo "title box ref: @$TITLE_BOX"
$AB fill "@$TITLE_BOX" "দ্বিতীয় বাংলা নোটিশ পরীক্ষা" >/dev/null 2>&1
$AB find role button click --name "নোটিশ তৈরি করুন" >/dev/null 2>&1
sleep 2.5
echo "--- toast ---"
$AB snapshot 2>&1 | grep -B1 -A3 "listitem \[level=1\] \[ref" | head -6
echo "--- slug display ---"
$AB snapshot 2>&1 | grep -A2 "স্লাগ:" | head -4
echo "--- url ---"; $AB get url 2>&1
echo "--- POST status ---"
$AB network requests --filter "api/admin/notices" 2>&1 | tail -2

echo "===== cleanup: delete leftover test notices ====="
$AB open "http://127.0.0.1:3000/admin/notices?q=%E0%A6%85%E0%A7%8D%E0%A7%9F%E0%A6%BE%E0%A6%A1%E0%A6%BF%E0%A6%9F" >/dev/null 2>&1; $AB wait --load networkidle >/dev/null 2>&1; sleep 1.5
$AB snapshot -i 2>&1 | grep -E "link \"অডিট|link \"দ্বিতীয়" | head -4
$AB open "http://127.0.0.1:3000/admin/notices" >/dev/null 2>&1; $AB wait --load networkidle >/dev/null 2>&1; sleep 1
DEL1=$($AB snapshot -i 2>&1 | grep -m1 'link "অডিট টেস্ট নোটিশ' | grep -oE 'e[0-9]+')
echo "leftover notice edit link: @$DEL1"
$AB click "@$DEL1" >/dev/null 2>&1; sleep 2
$AB get url 2>&1
$AB find role button click --name "মুছে ফেলুন" >/dev/null 2>&1; sleep 1
$AB find role button click --name "নিশ্চিত করুন" >/dev/null 2>&1; sleep 2.5
$AB get url 2>&1
$AB snapshot 2>&1 | grep -E "মুছে ফেলা হয়েছে" | head -2

echo "===== BATCH4 COMPLETE ====="
kill $SRV 2>/dev/null; wait $SRV 2>/dev/null
echo done
