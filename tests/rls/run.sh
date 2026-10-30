#!/usr/bin/env bash
# Runs the RLS tests against a throwaway local PostgreSQL cluster (no Supabase needed).
# Requires PostgreSQL binaries. Run as a non-root user, or as root (it will use the "postgres" user).
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$HERE/../.." && pwd)"
PGBIN="$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | tail -1 || true)"
[ -n "$PGBIN" ] || PGBIN="$(dirname "$(command -v postgres)")"

if [ "$(id -u)" = "0" ]; then
  WORK="$(mktemp -d)"; chown postgres "$WORK"; chmod -R a+rX "$HERE" "$ROOT/supabase"
  exec su postgres -s /bin/bash -c "PGWORK=$WORK '$0' --inner"
fi
WORK="${PGWORK:-$(mktemp -d)}"
[ "${1:-}" = "--inner" ] || true

"$PGBIN/initdb" -D "$WORK/data" -A trust >/dev/null
"$PGBIN/pg_ctl" -D "$WORK/data" -o "-p 54999 -k $WORK -c listen_addresses=''" -w -l "$WORK/log" start >/dev/null
trap '"$PGBIN/pg_ctl" -D "$WORK/data" -m immediate stop >/dev/null; rm -rf "$WORK"' EXIT
PSQL=("$PGBIN/psql" -h "$WORK" -p 54999 -U postgres -v ON_ERROR_STOP=1 -q postgres)
"${PSQL[@]}" -f "$HERE/shim.sql"
for m in "$ROOT"/supabase/migrations/*.sql; do "${PSQL[@]}" -f "$m"; done
for t in rls.test.sql chat.test.sql; do "${PSQL[@]}" -f "$HERE/$t" 2>&1; done
