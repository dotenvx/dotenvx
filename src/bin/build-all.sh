#!/bin/bash

targets=(
  "bun-darwin-arm64-modern:dotenvx-darwin-arm64-modern"
  "bun-darwin-x64-modern:dotenvx-darwin-x64-modern"
  "bun-linux-arm64-modern:dotenvx-linux-arm64-modern"
  "bun-linux-x64-modern:dotenvx-linux-x64-modern"
  "bun-windows-x64-modern:dotenvx-windows-x64-modern.exe"
)

for target_pair in "${targets[@]}"; do
  target="${target_pair%%:*}"
  output="${target_pair##*:}"
  echo "Building for $target..."
  bun build --compile --no-compile-autoload-dotenv --no-compile-autoload-bunfig --minify --sourcemap --bytecode --target="$target" ./src/bin/standalone.ts --outfile "./dist/$output"
done
