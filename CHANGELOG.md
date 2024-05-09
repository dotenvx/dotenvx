# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [Unreleased](https://github.com/dotenvx/dotenvx/compare/v0.38.0...main)

## 0.38.0

### Changed

* ⚠️ DEPRECATION NOTICE: the following commands are being moved. Please, update any code and muscle memory you have related to these:
  * `dotenvx encrypt` => `dotenvx vault encrypt`
  * `dotenvx decrypt` => `dotenvx vault decrypt`
  * `dotenvx status` => `dotenvx vault status`
* ⚠️ DEPRECATION NOTICE: the beta `hub` commands are being completely deprecated (they will be fully removed in upcoming 1.0.0 release). We will provide .env.keys tooling at a later time (replacing hub) but in the context of the new `--encrypt` flag functionality below

### Added

* 🎉 `--encrypt` flag for `dotenv set`. usage: 

#### Usage

```
$ dotenvx set HELLO World --encrypt`
```

This encrypts the values inside your `.env` file.

![](https://github.com/dotenvx/dotenvx/assets/3848/ef8974b4-44ad-408e-bfc9-7e1540f93be7)

Further notes:

* A keypair of `DOTENV_PUBLIC_KEY` and `DOTENV_PRIVATE_KEY` are generated.
* `DOTENV_PUBLIC_KEY` lives in the `.env` file. You can safely share this with whomever you wish.
* `DOTENV_PRIVATE_KEY` lives in your `.env.keys` file. Share this only with those you trust to decrypt your secrets.
* These asymmetric keys are generated using the same elliptical curve Bitcoin uses - `secp256k1`.
* If using encrypted `.env` files like this we recommend, and is safe, committing your `.env` file to code.
* Tell your contributors to contribute a secret using the command `dotenvx set HELLO world --encrypt`.
* Set your `DOTENV_PRIVATE_KEY` on your server to decrypt these values using `dotenvx run -- yourcommand`
* You can repeat all this per environment by modifying your set command to `dotenvx set HELLO production -f .env.production --encrypt` (for example)
* This solution is brand new, but I think it will now be the future. It removes the need for a difficult to read/understand `.env.vault` file. As a user you have much more control over combining encrypted .env files as you see fit - a limitation of `.env.vault`, and it makes seeing what changed (by KEY) easy in a Pull Request.
* In time we will add better tooling for sharing the `.env.keys` but until then safely share with team members you trust. This is powerful for large open source projects that want to allow contributions without those contributors being able to decrypt values. They can add a secret but not decrypt it.
* Be patient as we update our documentation to prioritize this improved encryption format for `.env` files.

## 0.37.1

* warn when running `dotenvx status` against any untracked (not in .env.vault) files ([#196](https://github.com/dotenvx/dotenvx/pull/196))

## 0.37.0

* add `--convention nextjs` flag to `dotenvx run` ([#193](https://github.com/dotenvx/dotenvx/pull/193))
* improve `status` error message when decrypt fails or no `.env*` files ([#192](https://github.com/dotenvx/dotenvx/pull/192))

## 0.36.1

* handle `SIGTERM` ([#191](https://github.com/dotenvx/dotenvx/pull/191))

## 0.36.0

* add `dotenvx status` command ([#186](https://github.com/dotenvx/dotenvx/pull/186))
* add `dotenvx decrypt [directory]` argument option ([#186](https://github.com/dotenvx/dotenvx/pull/186))
* add `dotenvx decrypt --environment` flag option ([#186](https://github.com/dotenvx/dotenvx/pull/186))
* normalize windows `\` paths ([#186](https://github.com/dotenvx/dotenvx/pull/186))

## 0.35.1

### Changed

* exit code `1` if `get KEY` not found/undefined ([#185](https://github.com/dotenvx/dotenvx/pull/185))

## 0.35.0

### Added

* added `set` command, and optionally pass `--env-file` flag(s) to `set` usage: `dotenvx set HELLO World` ([#182](https://github.com/dotenvx/dotenvx/pull/182))

## 0.34.0

### Changed

* make `hub push` more forgiving by permitting full filepath like `hub push directory/.env.keys` ([#180](https://github.com/dotenvx/dotenvx/pull/180))
* add note on generated `.env.example` ([#181](https://github.com/dotenvx/dotenvx/pull/181))

## 0.33.1

### Changed

* patch injection around falsy values ([#177](https://github.com/dotenvx/dotenvx/pull/177))

## 0.33.0

### Added

* add .env.vault support for `.env.something.something` (useful for Next.js pattern of .env.development.local) ([#174](https://github.com/dotenvx/dotenvx/pull/174))

## 0.32.0

### Changed

* quiet exit code 1 message ([#173](https://github.com/dotenvx/dotenvx/pull/173))

## 0.31.1

### Changed

* improve error messages ([#171](https://github.com/dotenvx/dotenvx/pull/171))

## 0.31.0

### Added

* add `hub logout` command ([#170](https://github.com/dotenvx/dotenvx/pull/170))

## 0.30.2

### Changed

* small fixes for windows users related to `hub open` and `hub push` ([#169](https://github.com/dotenvx/dotenvx/pull/169))

## 0.30.1

### Changed

* remove windows warnings related to missing `git` or `git origin` ([#166](https://github.com/dotenvx/dotenvx/pull/166) [#167](https://github.com/dotenvx/dotenvx/pull/167))

## 0.30.0

### Added

* `dotenvx get --quiet` will display the value no matter what (adds a `blank0` logger level) ([#161](https://github.com/dotenvx/dotenvx/pull/161))

### Changed

* refactor `dotenvx get` to use `run` under the hood

## 0.29.2

### Changed

* fix broken `hub login` and `hub open` ([#160](https://github.com/dotenvx/dotenvx/pull/160))

## 0.29.1

### Changed

* patch situation where `DOTENV_KEY` is present and `--env-file` flag is set. assume to still look for `.env.vault` file as first in line ([#157](https://github.com/dotenvx/dotenvx/pull/157))

## 0.29.0

### Changed

* respect order for `--env-vault-file`, `--env-file` and `--env` flags (for example: `dotenvx run --env "HELLO=one" --env-file=.env` will prioritize `--env` flag. Add `--overload` here to prioritize `--env-file` or reverse the order.). you can now mix and match multiple flags in any complex order you wish and dotenvx will respect it. ([#155](https://github.com/dotenvx/dotenvx/pull/155))

## 0.28.0

### Added

* add `dotenvx settings` command to list your current settings. in the future we'll provide ways to modify these settings as dotenvx's functionality grows ([#153](https://github.com/dotenvx/dotenvx/pull/153))

## 0.27.2

### Added

* add windows postrelease step to check that `dotenvx.exe` is functional immediately after release ([#141](https://github.com/dotenvx/dotenvx/pull/141))

### Changed

* replace `package-json` with `undici` ([#146](https://github.com/dotenvx/dotenvx/pull/146))
* prune redundant packages ([#148](https://github.com/dotenvx/dotenvx/pull/148))
* return current version if remote version fails ([#149](https://github.com/dotenvx/dotenvx/pull/149))
* switch to our own update notice mechanism (eliminating multiple deps) ([#151](https://github.com/dotenvx/dotenvx/pull/151))

## 0.27.1

### Added

* provide `.zip` download option for windows executable ([#140](https://github.com/dotenvx/dotenvx/pull/140))

### Removed

* remove `got` from top level deps ([#139](https://github.com/dotenvx/dotenvx/pull/139))

## 0.27.0

### Changed

* move `update-notifier` into `lib/helpers` for more control over `got` lib ([#138](https://github.com/dotenvx/dotenvx/pull/138))
* move `clipboardy` into `lib/helpers` for more control and to support commonjs going forward (sindre has dropped support and many mature systems still require commonjs for their infra and have need of dotenvx). ([#137](https://github.com/dotenvx/dotenvx/pull/137))

## 0.26.0

### Added

* add `hub pull` command to pull a repo's `.env.keys` down. ([#129](https://github.com/dotenvx/dotenvx/pull/129))

## 0.25.1

### Changed

* 🐞 patch bug with evaluate commands. do not attempt to evaluate risky preset envs in `process.env`. evaluate only what's set in a `.env*` file ([#125](https://github.com/dotenvx/dotenvx/pull/125))

## 0.25.0

### Added

* expand `hub push` with `[directory]` option. use for monorepos. for example: `dotenvx hub push apps/backend` ([#121](https://github.com/dotenvx/dotenvx/pull/121))

## 0.24.0

### Added

* add command substitution. for example `DATABASE_URL="postgres://$(whoami)@localhost/my_database"` ([#113](https://github.com/dotenvx/dotenvx/pull/113))

## 0.23.0

### Added

* support personal environment variables. anything after the comment `# personal.dotenvx.com` will be considered personal and will not be encrypted to .env.vault ([#110](https://github.com/dotenvx/dotenvx/pull/110))

## 0.22.0

### Added

* `require('@dotenvx/dotenvx').config()` expands/interpolates variables. this matches the behavior of `run`. (note that this behavior differs from the original `require('dotenv').config()` ([#107](https://github.com/dotenvx/dotenvx/pull/107))

## 0.21.0

### Added

* expose `genexample` function on `lib/main.js` for export convenience ([#102](https://github.com/dotenvx/dotenvx/pull/102))

### Changed

* rely on `which` npm module to find system command path for user inputted command(s) ([#105](https://github.com/dotenvx/dotenvx/pull/105))

### Removed

* remove `main.inject` function ([#102](https://github.com/dotenvx/dotenvx/pull/102))

## 0.20.2

### Added

* added support for `--env` flag on the `.env.vault` decryption portion of `run` ([#101](https://github.com/dotenvx/dotenvx/pull/101))

## 0.20.1

### Changed

* use system command path ([#98](https://github.com/dotenvx/dotenvx/pull/98))

## 0.20.0

### Changed

* added `--env` flag. for example, `dotenvx --env="HELLO=World" -- yourcommand` ([#94](https://github.com/dotenvx/dotenvx/pull/94))

## 0.19.1

### Changed

* patched up the `precommit` command ([#91](https://github.com/dotenvx/dotenvx/pull/91))

## 0.19.0

### Added

* added `scan` command to scan for possible leaked secrets in your code ([#90](https://github.com/dotenvx/dotenvx/pull/90))

## 0.18.0

### Added

* added `get` command, optionally pass `--env-file` flag(s) to `get`, optionally pass `--overload`, and optionally pass `--pretty-print`. usage: `dotenvx get HELLO` => `World` ([#89](https://github.com/dotenvx/dotenvx/pull/89))

## 0.17.1

### Changed

* expose `main.encrypt` and `main.ls` functions

## 0.17.0

### Added

* added `[directory]` argument to `encrypt`. for example, in your nx repo from root `dotenvx encrypt apps/backend` will encrypt .env* files in that directory and manage the `.env.keys` and `.env.vault` in that directory as well ([#82](https://github.com/dotenvx/dotenvx/pull/82))

## 0.16.1

### Changed

* bumped `dotenv` version to fix `encrypt` bug

## 0.16.0

### Added

* added `ls` command to list all your `.env*` files ([#80](https://github.com/dotenvx/dotenvx/pull/80))
* added `--env-file` option `ls` ([#82](https://github.com/dotenvx/dotenvx/pull/82))
* optionally specify `--env-vault-file` path to `.env.vault` (defaults to `.env.vault`) ([#73](https://github.com/dotenvx/dotenvx/pull/73))

## 0.15.4

### Changed

* 🐞 patch `--overload` flag logic ([#66](https://github.com/dotenvx/dotenvx/pull/66))

## 0.15.3

### Changed

* 🐞 fix undici readablestream error ([#65](https://github.com/dotenvx/dotenvx/pull/65))

## 0.15.2

### Changed

* switch from axios to undici ([#59](https://github.com/dotenvx/dotenvx/pull/59))
* bump `dotenv-expand` ([#63](https://github.com/dotenvx/dotenvx/pull/63))

## 0.15.1

### Changed

* use improved dotenv expansion ([#62](https://github.com/dotenvx/dotenvx/pull/62))

## 0.15.0

### Added

* add expansion ([#60](https://github.com/dotenvx/dotenvx/pull/60))
* use `dotenvx.com` ([#56](https://github.com/dotenvx/dotenvx/pull/56))

## 0.14.1

### Changed

* patch esm issue. use update-notifier ^5.1.0

## 0.14.0

### Added

* Added `genexample` command. Generate `.env.example` from your `.env` file. ([#49](https://github.com/dotenvx/dotenvx/pull/49))
* couple security patches ([#50](https://github.com/dotenvx/dotenvx/pull/50), [#51](https://github.com/dotenvx/dotenvx/pull/51))

## 0.13.0

### Added

* Added `decrypt` command. Decrypt `.env.vault` to prospective `.env*` files. `.env.keys` must be present. ([#48](https://github.com/dotenvx/dotenvx/pull/48))

## 0.12.0

### Added

* Append to `.gitignore` with `gitignore` command (also `.dockerignore`, `.npmignore`, and `.vercelignore` if existing) ([#47](https://github.com/dotenvx/dotenvx/pull/47))

## 0.11.0

### Removed

* no longer append to `*ignore` files automatically. too invasive. will provide as separate cli command ([#45](https://github.com/dotenvx/dotenvx/pull/45))

## 0.10.6

### Changed

* Improve error message when decryption fails ([#40](https://github.com/dotenvx/dotenvx/pull/40))

## 0.10.5

### Changed

* Rename `predockerbuild` command to `prebuild` ([#36](https://github.com/dotenvx/pull/36))

## 0.10.4

### Added

* Add `predockerbuild` command to prevent including `.env` file in your docker builds ([#35](https://github.com/dotenvx/pull/35))

## 0.10.3

### Changed

* If dotenvx is missing tell user how to install it from pre-commit ([#34](https://github.com/dotenvx/pull/34))
* Add help notice for ci (when .env file not present) ([#33](https://github.com/dotenvx/pull/33))

## 0.10.2

### Changed

* Improve error message when custom `--env-file` passed ([#32](https://github.com/dotenvx/pull/32))

## 0.10.1

### Changed

* Adjust `precommit` verbosity and coloring
* Add `--install` flag to precommit - installs to `.git/hooks/pre-commit` ([#31](https://github.com/dotenvx/dotenvx/pull/31))

## 0.10.0

### Added

* Added `dotenvx precommit` command and instructions for git pre-commit hook ([#30](https://github.com/dotenvx/dotenvx/pull/30))

## 0.9.0

### Changed

* Remove `.flaskenv` from appends ([#27](https://github.com/dotenvx/dotenvx/pull/27))
* Improved error message when .env file is missing ([#28](https://github.com/dotenvx/dotenvx/pull/28))

## 0.8.4

### Changed

Load `axios` with a try/catch depending on context 🐞 ([#24](https://github.com/dotenvx/dotenvx/pull/24))

## 0.8.3

### Changed

Patched `helpers.guessEnvironment` bug when filepath contained a `.` in the folder name. 🐞 ([#23](https://github.com/dotenvx/dotenvx/pull/23))

## 0.8.2

### Changed

Change path to axios in attempt for `pkg` to build correctly.

## 0.8.1

### Added

Add axios (missing) to `package-lock.json`

## 0.8.0

### Added

Added [hub](https://hub.dotenvx.com) support. 🎉 ([#16](https://github.com/dotenvx/dotenvx/pull/16))

## 0.7.4

### Changed

Create binaries with root:root defaults. ([#21](https://github.com/dotenvx/dotenvx/pull/21))

## 0.7.3

### Added

Tell user about undefined subprocess with additional `debug` logs ([#19](https://github.com/dotenvx/dotenvx/pull/19))

## 0.7.2

### Added

`debug` other signals send to execa process ([#18](https://github.com/dotenvx/dotenvx/pull/18))

## 0.7.1

### Changed

Fix missed package.json#version

## 0.7.0

### Added

handle `SIGINT` ([#17](https://github.com/dotenvx/dotenvx/pull/17))

## 0.6.13

write to `/latest` only for [releases](https://github.com/dotenvx/releases) repo ([#15](https://github.com/dotenvx/dotenvx/pull/15))

## 0.6.12

### Changed

do not package README alongside binary. adds noise to a user's machine. keep their machine shiny. ([#14](https://github.com/dotenvx/dotenvx/pull/14))

## 0.6.11

### Added

tell user what to do next ([#13](https://github.com/dotenvx/dotenvx/pull/13))

## 0.6.10

### Patched

do not log when error code is 0 ([#12](https://github.com/dotenvx/dotenvx/pull/12))

## 0.6.9

### Added

tell user when no changes to re-encrypt ([#11](https://github.com/dotenvx/dotenvx/pull/11))

## 0.6.8

### Added

added help text when user's command fails. include link to report issue ([#10](https://github.com/dotenvx/dotenvx/pull/10))

## 0.6.7

## Added

added next step help message when running `dotenvx run` with no argument ([#9](https://github.com/dotenvx/dotenvx/pull/9))


## 0.6.6

### Added

help includes a command example as well as a full working 'try it out' example ([#8](https://github.com/dotenvx/dotenvx/pull/8))

## 0.6.5

### Changed

made the info messaging more succinct ([#7](https://github.com/dotenvx/dotenvx/pull/7))

## 0.6.4

### Added

added tagged images to [hub.docker.com/u/dotenv](https://hub.docker.com/r/dotenv/dotenvx/tags)

## 0.6.3

### Changed

fixed the `.env.keys` file comment. spacing was off. ([#6](https://github.com/dotenvx/dotenvx/pull/6))

## 0.6.2

### Added

added help text to `encrypt`. ([#5](https://github.com/dotenvx/dotenvx/pull/5))

## 0.6.1

### Changed

removed the `pad` on the logging level. didn't look good when running in default INFO mode. ([#4](https://github.com/dotenvx/dotenvx/pull/4))

## 0.6.0

### Added

prevent committing a `.env*` file to code. append to `.gitignore`, `.dockerignore`, `.vercelignore`, and `.npmignore` 🗂️ ([#3](https://github.com/dotenvx/dotenvx/pull/3))

## 0.5.0

### Added

`run` support for `.env.vault` files 🔑 ([#2](https://github.com/dotenvx/dotenvx/pull/2))

## 0.4.0

### Added

`encrypt` 🔐 ([#1](https://github.com/dotenvx/dotenvx/pull/1))

## 0.3.9 and prior

Please see commit history.

