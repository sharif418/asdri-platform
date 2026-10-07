#!/bin/bash
# QA helper: ensure dev server on :3000 is up (start if down). Read-only for repo.
if curl -s -o /dev/null --max-time 5 http://127.0.0.1:3000/login; then
  if [ "$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 http://127.0.0.1:3000/login)" = "200" ]; then
    echo "server already up"
    exit 0
  fi
fi
cd /home/z/asdri-platform
setsid bash -c 'set -a; source .env; set +a; export PATH="/home/z/asdri-platform/node_modules/.bin:$PATH"; exec next dev -p 3000 >> /home/z/asdri-platform/dev.log 2>&1' < /dev/null > /dev/null 2>&1 &
for i in $(seq 1 40); do
  sleep 2
  code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 http://127.0.0.1:3000/login 2>/dev/null)
  if [ "$code" = "200" ]; then
    echo "server started (attempt $i)"
    exit 0
  fi
done
echo "server failed to start"
exit 1
