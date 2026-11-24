## dotenvx run startup benchmark

darwin arm64 | hyperfine 2.0.0 | 3 runs after 1 warmups

Median of 3 runs after 1 warmups.

30 fake variables, legacy encryption, local .env.keys, telemetry and remote custody disabled.
Each timed command loads/decrypts .env and launches /usr/bin/true. No Node app is launched.
Both binaries pass an untimed check of all 30 decrypted values before benchmarking.

| Published binary | Startup time | Binary size |
| --- | ---: | ---: |
| dotenvx 2 (2.38.2) | 527.55 ms | 52.44 MB |
| dotenvx 3 RC (3.0.0-rc0) | 8.72 ms | 7.59 MB |

Stable / RC median time ratio: **60.53×**.

Binary size is the uncompressed executable size; 1 MB = 1,000,000 bytes.

Timings are informational; correctness, installer, and command failures fail the job.

**Smoke run only: do not use these timings as published performance results.**
