# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [Unreleased](https://github.com/dotenvx/dotenvx/compare/v0.7.1...main)

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

