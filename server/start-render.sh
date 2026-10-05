#!/bin/sh
set -eu

if [ ! -f /var/data/db.json ]; then
  cp server/db.json /var/data/db.json
fi

exec ./node_modules/.bin/json-server \
  --watch /var/data/db.json \
  --routes server/routes.json \
  --host 0.0.0.0 \
  --port "${PORT:-10000}"