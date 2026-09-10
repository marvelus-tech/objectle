#!/usr/bin/env bash
# Smoke-test: agent tool calls against a local Worker room.
# Usage: npm run smoke:agent -- ABCD
set -euo pipefail

CODE="${1:-}"
BASE="${OBJECTLE_API:-http://127.0.0.1:8787/api}"

if [[ -z "$CODE" ]]; then
  echo "Usage: npm run smoke:agent -- <ROOM_CODE>"
  echo "Open http://127.0.0.1:3000, copy ?room=XXXX from the URL, then re-run."
  exit 1
fi

CODE="$(echo "$CODE" | tr '[:lower:]' '[:upper:]')"
ROOM="$BASE/room/$CODE"

echo "== health =="
curl -sS "$BASE/health"
echo
echo
echo "== room manual =="
curl -sS "$ROOM" | head -n 24
echo
echo
echo "== read_view =="
curl -sS "$ROOM/tools/read_view"
echo
echo
echo "== rotate_object y 30 =="
curl -sS "$ROOM/tools/rotate_object?axis=y&degrees=30"
echo
echo
echo "== publish_status =="
curl -sS --get --data-urlencode "headline=Local agent lab online" "$ROOM/tools/publish_status"
echo
echo
echo "== events (host poll) =="
curl -sS "$ROOM/events?since=0&host=1" | head -c 900
echo
echo
echo "Watch the host UI at http://127.0.0.1:3000?room=$CODE — rotation + timeline should update."
