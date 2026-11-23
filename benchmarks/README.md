# dotenvx run startup benchmark

Compare the latest published stable dotenvx 2 binary from `https://dotenvx.sh`
with the pinned dotenvx 3 candidate, currently `0.4.17`, from
`https://dotenvx.sh?version=0.4.17`. Both installers run in temporary directories;
the globally installed dotenvx is untouched. The repository's source version is
not built or measured.

Install Hyperfine (`brew install hyperfine` on macOS or
`sudo apt-get install hyperfine` on Ubuntu), then run:

```sh
npm run test:perf
```

Node is needed for the harness and the untimed correctness check. No `npm install`
is required: the harness only uses Node built-ins. To check the setup quickly:

```sh
npm run test:perf -- --smoke
```

The fixture has 30 made-up app variables encrypted in the classic `encrypted:`
format. Its committed private key is a public, test-only key and must never be
used for actual secrets. Each binary first loads the fixture and verifies every
decrypted value. Encryption and correctness checks happen outside the timing.

Hyperfine performs 5 warmups and 50 measured runs per binary:

```sh
dotenvx run --strict --quiet -f .env -- /usr/bin/true
```

This measures executable startup, file loading, legacy decryption, environment
injection, and minimal child process overhead. It is not an in-process parser
benchmark. Telemetry and remote custody are disabled, and both binaries use the
same local `.env.keys`. Inherited fixture variables and dotenvx settings are
removed from the measured environment.

`benchmark-results/` contains Hyperfine JSON and Markdown, exact downloaded
versions and machine metadata, and a summary with median startup times, their
ratio, and uncompressed executable sizes in MB (1 MB = 1,000,000 bytes).
Exact executable sizes in bytes are also recorded in `metadata.json`. Smoke results are explicitly marked and are not publication results.

The independent `performance` workflow runs on pushes and PRs to `main`, and can
also be dispatched manually. Its only runners are Ubuntu 24.04 x64 and macOS 15
arm64. Each puts the summary in GitHub Actions and uploads its result files.
No release event, credentials, or package publication is involved. It fails on
incorrect output or installation/execution errors, but has no speed threshold.
Compare versions on the same runner; do not compare absolute times across OSes.

To change the pinned candidate, edit `betaVersion` in `scripts/performance.cjs`.
If the stable installer stops serving 2.x, the harness fails explicitly so the
comparison cannot silently become v3 versus v3.
