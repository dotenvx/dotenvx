#!/usr/bin/env bash

set -euo pipefail

export CI=
export HOME="${RUNNER_TEMP:-/tmp}/dotenvx-linux-native-home"
export XDG_RUNTIME_DIR="${RUNNER_TEMP:-/tmp}/dotenvx-linux-native-runtime"

mkdir -p "$HOME" "$XDG_RUNTIME_DIR"
chmod 700 "$XDG_RUNTIME_DIR"

eval "$(printf '%s' 'dotenvx-ci' | gnome-keyring-daemon --unlock --components=secrets)"

DOTENVX='./node_modules/.bin/dotenvx'
PUBLIC_KEY=''

cleanup () {
  if [ -n "$PUBLIC_KEY" ]; then
    secret-tool clear service dotenvx public-key "$PUBLIC_KEY" >/dev/null 2>&1 || true
  fi
}

trap cleanup EXIT

printf '%s\n' 'HELLO=LinuxNative' > .env
"$DOTENVX" encrypt --no-armor --no-native

PUBLIC_KEY="$(grep '^DOTENV_PUBLIC_KEY=' .env | tail -n 1 | cut -d= -f2- | tr -d '"')"
PRIVATE_KEY="$(grep '^DOTENV_PRIVATE_KEY=' .env.keys | tail -n 1 | cut -d= -f2- | tr -d '"')"

"$DOTENVX" native up 2>&1 | grep 'stored'
test ! -f .env.keys

"$DOTENVX" native up 2>&1 | grep 'no change'
test "$("$DOTENVX" get HELLO)" = 'LinuxNative'

"$DOTENVX" native down 2>&1 | grep 'moved to .env.keys'
grep -q "$PRIVATE_KEY" .env.keys

"$DOTENVX" native down 2>&1 | grep 'no change'

"$DOTENVX" native push 2>&1 | grep 'pushed'
test -f .env.keys

rm .env.keys
"$DOTENVX" native pull 2>&1 | grep 'pulled to .env.keys'
grep -q "$PRIVATE_KEY" .env.keys

rm .env.keys
"$DOTENVX" native pull 2>&1 | grep 'pulled to .env.keys'
grep -q "$PRIVATE_KEY" .env.keys
