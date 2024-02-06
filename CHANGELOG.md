# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [Unreleased](https://github.com/dotenvx/dotenvx/compare/v0.15.0...main)

## 0.15.0

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

