#!/bin/bash
# ensure_server.sh — restart the shared Next.js dev server if it's down.
# Capped heap to reduce cgroup-OOM kills under parallel-auditor memory pressure.
cd /home/z/asdri-platform
if curl -s -o /dev/null -m 5 http://127.0.0.1:3000/login; then
  echo "server-up"
  exit 0
fi
python3 - <<'EOF'
import os
if os.fork() == 0:
    if os.fork() == 0:
        os.setsid()
        devnull = os.open(os.devnull, os.O_RDWR)
        for fd in (0,1,2):
            os.dup2(devnull, fd)
        os.execv("/bin/bash", ["bash", "-c",
            "cd /home/z/asdri-platform && set -a && source .env && set +a && "
            "NODE_OPTIONS=--max-old-space-size=1280 exec ./node_modules/.bin/next dev -p 3000 >> dev.log 2>&1"])
    os._exit(0)
os.waitpid(-1, 0)
EOF
for i in $(seq 1 30); do
  sleep 3
  if curl -s -o /dev/null -m 8 http://127.0.0.1:3000/login; then
    echo "server-started"
    exit 0
  fi
done
echo "server-failed"
exit 1
