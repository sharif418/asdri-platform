#!/bin/bash
# Dev server launcher — loads .env with override semantics so the sandbox's
# inherited scaffold env (sqlite) can never shadow the project's Postgres URL.
set -a
source "$(dirname "$0")/../.env"
set +a
exec next dev -p 3000 2>&1 | tee dev.log
