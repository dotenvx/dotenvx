#!/usr/bin/env bash

set -euo pipefail

export CI=
export HOME="${RUNNER_TEMP:-/tmp}/dotenvx-linux-native-home"
export XDG_RUNTIME_DIR="${RUNNER_TEMP:-/tmp}/dotenvx-linux-native-runtime"

mkdir -p "$HOME" "$XDG_RUNTIME_DIR"
chmod 700 "$XDG_RUNTIME_DIR"

eval "$(printf '%s' 'dotenvx-ci' | gnome-keyring-daemon --unlock --components=secrets)"

node "$(dirname "$0")/native-store.cjs"
