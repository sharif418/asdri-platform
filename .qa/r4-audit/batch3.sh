#!/bin/bash
# Batch 3: remaining phone widths, FAQ dialog a11y, new-course dialog, login page, misc.
cd /home/z/asdri-platform
LOG=/home/z/asdri-platform/.qa/r4-audit/dev-batch3.log
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

echo "===== phone widths: forms ====="
$AB set viewport 390 844 >/dev/null 2>&1
for pair in "videos/new:videos-new" "people/new:people-new" "gallery/new:gallery-new"; do
  route="${pair%%:*}"; name="${pair##*:}"
  $AB open "http://127.0.0.1:3000/admin/$route" >/dev/null 2>&1; $AB wait --load networkidle >/dev/null 2>&1; sleep 1.5
  echo -n "$name phone: "; $AB eval "document.documentElement.scrollWidth" 2>&1
done
$AB open "http://127.0.0.1:3000/admin/notices/audit-test-notice" >/dev/null 2>&1; $AB wait --load networkidle >/dev/null 2>&1; sleep 1.5
echo -n "notices-edit phone: "; $AB eval "document.documentElement.scrollWidth" 2>&1

echo "===== errors sweep (desktop) ====="
$AB set viewport 1440 900 >/dev/null 2>&1
for r in gallery videos people courses; do
  $AB errors --clear >/dev/null 2>&1; $AB console --clear >/dev/null 2>&1
  $AB open "http://127.0.0.1:3000/admin/$r" >/dev/null 2>&1; $AB wait --load networkidle >/dev/null 2>&1; sleep 1
  echo "--- $r errors:"; $AB errors 2>&1 | head -3
done

echo "===== FAQ dialog: open + focus trap + Escape ====="
$AB open "http://127.0.0.1:3000/admin/content/faqs" >/dev/null 2>&1; $AB wait --load networkidle >/dev/null 2>&1; sleep 1
$AB find role button click --name "নতুন প্রশ্নোত্তর" >/dev/null 2>&1; sleep 1
$AB snapshot -i 2>&1 | grep -E "dialog|textbox|combobox|button \"(সংরক্ষণ|বাতিল|রদ্দ)" | head -12
for i in 1 2 3 4 5 6 7 8; do $AB press Tab >/dev/null 2>&1; done
echo -n "focus after 8 tabs: "; $AB eval "document.activeElement.tagName + '|' + (document.activeElement.getAttribute('aria-label')||document.activeElement.placeholder||document.activeElement.textContent.trim().slice(0,25)||'')" 2>&1
$AB press Escape >/dev/null 2>&1; sleep 0.8
echo -n "dialog still open after Escape? "; $AB eval "!!document.querySelector('[role=dialog]')" 2>&1

echo "===== courses: নতুন কোর্স button behavior ====="
$AB open "http://127.0.0.1:3000/admin/courses" >/dev/null 2>&1; $AB wait --load networkidle >/dev/null 2>&1; sleep 1
$AB find role button click --name "নতুন কোর্স" >/dev/null 2>&1; sleep 1
$AB get url 2>&1
$AB snapshot -i 2>&1 | grep -E "dialog|heading \"|textbox|combobox|button" | head -14
$AB press Escape >/dev/null 2>&1

echo "===== login page while authenticated ====="
$AB open "http://127.0.0.1:3000/login" >/dev/null 2>&1; $AB wait --load networkidle >/dev/null 2>&1; sleep 1.5
$AB get url 2>&1
$AB snapshot -i 2>&1 | grep -vE "region|Open Next" | head -14

echo "===== dashboard recent-notices draft evidence (code-level done) + notice edit page title ====="
$AB open "http://127.0.0.1:3000/admin/notices/audit-test-notice" >/dev/null 2>&1; $AB wait --load networkidle >/dev/null 2>&1; sleep 1
$AB snapshot -i 2>&1 | grep -E "heading|switch \"প্রকাশিত\"" | head -4

echo "===== BATCH3 COMPLETE ====="
kill $SRV 2>/dev/null; wait $SRV 2>/dev/null
echo done
