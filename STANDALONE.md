# Standalone Binary

Build dotenvx as a single-file executable using [Bun's compile feature](https://bun.com/docs/bundler/executables). Use Bun v1.3.3 or later for optimal results.

## Files Added

- **`src/bin/standalone.ts`** - Entry point for building the standalone binary. Imports and runs the CLI module.
- **`src/bin/build-all.sh`** - An example script to build standalone binaries for all major platforms. Read more under "Recommended targets".
- **`bun.lock`** - Bun lockfile. Running `bun install` will automatically generate a `bun.lock` file based on the existing `package-lock.json`.

## Building

Compile dotenvx to a standalone binary for your target platform.

### Production Build Command

```bash
bun build --compile --no-compile-autoload-dotenv --no-compile-autoload-bunfig --minify --sourcemap --bytecode --target=<target> ./src/bin/standalone.ts --outfile ./dist/dotenvx-<target>
```

The production build includes:

- `--compile` - Compile to a standalone binary
- `--no-compile-autoload-dotenv` - Prevents automatic loading of `.env` files during compilation.
- `--no-compile-autoload-bunfig` - Prevents automatic loading of `bunfig.toml` during compilation.
- `--minify` - Minify the bundle
- `--sourcemap` - Generate sourcemap for debugging
- `--bytecode` - Experimental bytecode compilation for 2x faster startup (moves parsing from runtime to build-time)

### Recommended targets

- `bun-darwin-arm64-modern`
- `bun-darwin-x64-modern`
- `bun-linux-arm64-modern`
- `bun-linux-x64-modern`
- `bun-windows-x64-modern`

### Build Examples

**macOS ARM64 modern:**

```bash
bun build --compile --no-compile-autoload-dotenv --no-compile-autoload-bunfig --minify --sourcemap --bytecode --target=bun-darwin-arm64-modern ./src/bin/standalone.ts --outfile ./dist/dotenvx-bun-darwin-arm64-modern
```

**macOS x64 modern:**

```bash
bun build --compile --no-compile-autoload-dotenv --no-compile-autoload-bunfig --minify --sourcemap --bytecode --target=bun-darwin-x64-modern ./src/bin/standalone.ts --outfile ./dist/dotenvx-darwin-x64-modern
```

**Linux ARM64 modern:**

```bash
bun build --compile --no-compile-autoload-dotenv --no-compile-autoload-bunfig --minify --sourcemap --bytecode --target=bun-linux-arm64-modern ./src/bin/standalone.ts --outfile ./dist/dotenvx-linux-arm64-modern
```

**Linux x64 modern:**

```bash
bun build --compile --no-compile-autoload-dotenv --no-compile-autoload-bunfig --minify --sourcemap --bytecode --target=bun-linux-x64-modern ./src/bin/standalone.ts --outfile ./dist/dotenvx-linux-x64-modern
```

**Windows x64 modern:**

```bash
bun build --compile --no-compile-autoload-dotenv --no-compile-autoload-bunfig --minify --sourcemap --bytecode --target=bun-windows-x64-modern ./src/bin/standalone.ts --outfile ./dist/dotenvx-windows-x64-modern.exe
```

## Testing

After building, test the binary:

```sh
./dist/dotenvx-linux-x64 --version
./dist/dotenvx-linux-x64 --help
```
