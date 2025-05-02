#!/bin/sh

set -e
OS=""
ARCH=""
VERSION=""
DIRECTORY="/usr/local/bin"
REGISTRY_URL="https://registry.npmjs.org"
INSTALL_SCRIPT_URL="https://dotenvx.sh"
FORCE=0

#  ./install.sh
#  ___________________________________________________________________________________________________
#  |      _                                                                                          |
#  |     | |     | |                                                                                 |
#  |   __| | ___ | |_ ___ _ ____   ____  __                                                          |
#  |  / _` |/ _ \| __/ _ \ '_ \ \ / /\ \/ /                                                          |
#  | | (_| | (_) | ||  __/ | | \ V /  >  <                                                           |
#  |  \__,_|\___/ \__\___|_| |_|\_/  /_/\_\                                                          |
#  |                                                                                                 |
#  |                                                                                                 |
#  |  *a better dotenv*–from the creator of [`dotenv`](https://github.com/motdotla/dotenv).          |
#  |                                                                                                 |
#  |  * run anywhere (cross-platform)                                                                |
#  |  * multi-environment                                                                            |
#  |  * encrypted envs                                                                               |
#  |                                                                                                 |
#  |  ## Install                                                                                     |
#  |                                                                                                 |
#  |  ```sh                                                                                          |
#  |  curl -sfS https://dotenvx.sh | sh                                                              |
#  |  ```                                                                                            |
#  |                                                                                                 |
#  |  or self-execute this file:                                                                     |
#  |                                                                                                 |
#  |  ```sh                                                                                          |
#  |  curl -sfS https://dotenvx.sh > install.sh                                                      |
#  |  chmod +x install.sh                                                                            |
#  |  ./install.sh                                                                                   |
#  |  ```                                                                                            |
#  |                                                                                                 |
#  |  more install examples:                                                                         |
#  |                                                                                                 |
#  |  ```sh                                                                                          |
#  |  # curl examples                                                                                |
#  |  curl -sfS "https://dotenvx.sh" | sudo sh                                                       |
#  |  curl -sfS "https://dotenvx.sh?version=1.41.0" | sh                                             |
#  |  curl -sfS "https://dotenvx.sh?directory=." | sh                                                |
#  |  curl -sfS "https://dotenvx.sh?directory=/custom/path&version=1.41.0" | sh                      |
#  |                                                                                                 |
#  |  # self-executing examples                                                                      |
#  |  ./install.sh --version=1.41.0                                                                  |
#  |  ./install.sh --directory=.                                                                     |
#  |  ./install.sh --directory=/custom/path --version=1.41.0                                         |
#  |  ./install.sh --help                                                                            |
#  |  ```                                                                                            |
#  |                                                                                                 |
#  |  ## Usage                                                                                       |
#  |                                                                                                 |
#  |  ```sh                                                                                          |
#  |  $ echo "HELLO=World" > .env                                                                    |
#  |  $ echo "console.log('Hello ' + process.env.HELLO)" > index.js                                  |
#  |                                                                                                 |
#  |  $ node index.js                                                                                |
#  |  Hello undefined # without dotenvx                                                              |
#  |                                                                                                 |
#  |  $ dotenvx run -- node index.js                                                                 |
#  |  Hello World # with dotenvx                                                                     |
#  |  ```                                                                                            |
#  |                                                                                                 |
#  |  see [`dotenvx`](https://github.com/dotenvx/dotenvx) for extended usage guides.                 |
#  |                                                                                                 |
#  |_________________________________________________________________________________________________|

# usage ---------------------------------
usage() {
  echo "Usage: $0 [options] [command]"
  echo ""
  echo "install dotenvx – a better dotenv"
  echo ""
  echo "Options:"
  echo "  --os              override operating system (e.g., linux, darwin)"
  echo "  --arch            override architecture (e.g., x64, arm64)"
  echo "  --directory       directory to install dotenvx to (default: \"/usr/local/bin\")"
  echo "  --force           force reinstallation even if already installed (default: false)"
  echo "  --version         version of dotenvx to install (default: \"$VERSION\")"
  echo ""
  echo "Commands:"
  echo "  install           install dotenvx"
  echo "  help              display help"
}

# machine checks ------------------------
is_version_valid() {
  if [ -z "$VERSION" ]; then
    echo "[INSTALLATION_FAILED] VERSION ($VERSION) is blank in install.sh script"
    echo "? set VERSION to valid semantic semver version and try again"

    return 1
  fi

  local semver_regex="^([0-9]+)\.([0-9]+)\.([0-9]+)$"
  if echo "$VERSION" | grep -Eq "$semver_regex"; then
    return 0
  else
    echo "[INSTALLATION_FAILED] VERSION ($VERSION) is not a valid semantic version in install.sh script"
    echo "? set VERSION to valid semantic semver version and try again"

    return 1
  fi
}

is_directory_writable() {
  # check installation directory is writable
  if [ ! -w "$(directory)" ]; then
    echo "[INSTALLATION_FAILED] the installation directory [$(directory)] is not writable by the current user"
    echo "? run as root [$(help_sudo_install_command "$0")] or choose a writable directory like your current directory [$(help_customize_directory_command "$0")]"

    return 1
  fi

  return 0
}

is_curl_installed() {
  local curl_path="$(which_curl)"

  if [ -z "$curl_path" ]; then
    echo "[INSTALLATION_FAILED] curl is required and is not installed"
    echo "? install curl [$(help_install_curl_command)] and try again"

    return 1
  fi

  return 0
}

is_os_supported() {
  local os="$(os)"

  case "$os" in
  linux) os="linux" ;;
  darwin) os="darwin" ;;
  *)
    echo "[INSTALLATION_FAILED] your operating system ${os} is currently unsupported"
    echo "? request support by opening an issue at [https://github.com/dotenvx/dotenvx/issues]"

    return 1
    ;;
  esac

  return 0
}

is_arch_supported() {
  local arch="$(arch)"

  case "$arch" in
  x86_64) arch="x86_64" ;;
  amd64) arch="amd64" ;;
  arm64) arch="arm64" ;;
  aarch64) arch="aarch64" ;;
  *)
    echo "[INSTALLATION_FAILED] your architecture ${arch} is currently unsupported - must be x86_64, amd64, arm64, or aarch64"
    echo "? request support by opening an issue at [https://github.com/dotenvx/dotenvx/issues]"

    return 1
    ;;
  esac

  return 0
}

# is_* checks ---------------------------
is_piped() {
  [ "$0" = "sh" ] || [ "$0" = "bash" ]
}

is_ci() {
  [ -n "$CI" ] && [ $CI != 0 ]
}

is_test_mode() {
  [ -n "$TEST_MODE" ] && [ $TEST_MODE != 0 ]
}

is_windows() {
  [ "$(os)" = "windows" ]
}

is_installed() {
  if [ "$FORCE" = "1" ]; then
    return 1  # force install even if it's already installed
  fi

  local flagged_version="$1"
  local current_version=$("$(directory)/$(binary_name)" --version 2>/dev/null || echo "0")

  # if --version flag passed
  if [ -n "$flagged_version" ]; then
    if [ "$current_version" = "$flagged_version" ]; then
      # return true since version already installed
      return 0
    else
      # return false since version not installed
      return 1
    fi
  fi

  # if no version flag passed
  if [ "$current_version" != "$VERSION" ]; then
    # return false since latest is not installed
    return 1
  fi

  echo "[dotenvx@$current_version] already installed ($(directory)/$(binary_name))"

  # return true since version already installed
  return 0
}

# helpers -------------------------------
directory() {
  local dir=$DIRECTORY

  case "$dir" in
  ~*/*)
    dir="$HOME/${dir#\~/}"
    ;;
  ~*)
    dir="$HOME/${dir#\~}"
    ;;
  esac

  echo "${dir}"
  return 0
}

os() {
  if [ -n "$OS" ]; then
    echo "$OS"
  else
    echo "$(uname -s | tr '[:upper:]' '[:lower:]')"
  fi
}

arch() {
  if [ -n "$ARCH" ]; then
    echo "$ARCH"
  else
    echo "$(uname -m | tr '[:upper:]' '[:lower:]')"
  fi
}

os_arch() {
  echo "$(os)-$(arch)"

  return 0
}

filename() {
  echo "dotenvx-$VERSION-$(os_arch).tar.gz"

  return 0
}

download_url() {
  echo "$REGISTRY_URL/@dotenvx/dotenvx-$(os_arch)/-/dotenvx-$(os_arch)-$VERSION.tgz"

  return 0
}

progress_bar() {
  if $(is_ci); then
    echo "--no-progress-meter"
  else
    echo "--progress-bar"
  fi

  return 0
}

binary_name() {
  if $(is_windows); then
    echo "dotenvx.exe"
  else
    echo "dotenvx"
  fi

  return 0
}

# which_* -------------------------------
which_curl() {
  local result
  result=$(command -v curl 2>/dev/null) # capture the output without displaying it on the screen

  echo "$result"

  return 0
}

which_dotenvx() {
  local result
  result=$(command -v dotenvx 2>/dev/null) # capture the output without displaying it on the screen

  echo "$result"

  return 0
}

# warnings* -----------------------------
warn_of_any_conflict() {
  local dotenvx_path="$(which_dotenvx)"

  if [ "$dotenvx_path" != "" ] && [ "$dotenvx_path" != "$(directory)/$(binary_name)" ]; then
    echo "[DOTENVX_CONFLICT] conflicting dotenvx found at $dotenvx_path" >&2
    echo "? we recommend updating your path to include $(directory)" >&2
  fi

  return 0
}

# help text -----------------------------
help_sudo_install_command() {
  if is_piped; then
    echo "curl -sfS $INSTALL_SCRIPT_URL | sudo $0"
  else
    echo "sudo $0"
  fi

  return 0
}

help_customize_directory_command() {
  if is_piped; then
    echo "curl -sfS \"$INSTALL_SCRIPT_URL?directory=.\" | $0"
  else
    echo "$0 --directory=."
  fi

  return 0
}

help_install_curl_command() {
  if command -v apt-get >/dev/null 2>&1; then
    echo "sudo apt-get update && sudo apt-get install -y curl"
  elif command -v yum >/dev/null 2>&1; then
    echo "sudo yum install -y curl"
  elif command -v brew >/dev/null 2>&1; then
    echo "brew install curl"
  elif command -v pkg >/dev/null 2>&1; then
    echo "sudo pkg install curl"
  else
    echo "install curl manually"
  fi

  return 0
}

# install/run ---------------------------
install_dotenvx() {
  # 0. override version
  VERSION="${1:-$VERSION}"

  # 1. setup tmpdir
  local tmpdir=$(command mktemp -d)
  local pipe="$tmpdir/pipe"
  mkfifo "$pipe"

  install_failed_cleanup() {
    echo "[INSTALLATION_FAILED] failed to download from registry [$(download_url)]"
    echo "? verify the download url and try downloading manually"
    rm -r "$tmpdir"
  }

  # TODO: handle dotenvx.exe when on a windows machine? binary is not package/dotenvx, it's package/dotenvx.exe

  # Start curl in the background and redirect output to the pipe
  curl $(progress_bar) --fail -L --proto '=https' "$(download_url)" > "$pipe" &
  curl_pid=$!

  # Start tar in the background to read from the pipe
  sh -c "tar xz --directory $(directory) --strip-components=1 -f '$pipe' 'package/$(binary_name)'" &
  tar_pid=$!

  if ! wait $curl_pid || ! wait $tar_pid; then
    install_failed_cleanup
    return 1
  fi

  # 3. clean up
  rm -r "$tmpdir"

  # warn of any conflict
  warn_of_any_conflict

  # let user know
  echo "[dotenvx@$VERSION] installed successfully ($(directory)/$(binary_name))"
  echo "now type: dotenvx help"

  return 0
}

run() {
  # parse arguments
  for arg in "$@"; do
    case $arg in
    os=* | --os=*)
      OS="${arg#*=}"
      ;;
    arch=* | --arch=*)
      ARCH="${arg#*=}"
      ;;
    version=* | --version=*)
      VERSION="${arg#*=}"
      ;;
    directory=* | --directory=*)
      DIRECTORY="${arg#*=}"
      ;;
    force | --force)
      FORCE=1
      ;;
    help | --help)
      usage
      return 0
      ;;
    *)
      # Unknown option
      echo "Unknown option: $arg"
      usage
      return 1
      ;;
    esac
  done

  # machine checks
  is_version_valid
  is_directory_writable
  is_curl_installed
  is_os_supported
  is_arch_supported

  # install logic
  if [ -n "$VERSION" ]; then
    # Check if the specified version is already installed
    if is_installed "$VERSION"; then
      echo "[dotenvx@$VERSION] already installed ($(directory)/$(binary_name))"

      return 0
    else
      install_dotenvx "$VERSION"
    fi
  else
    if is_installed; then
      echo "[dotenvx@$VERSION] already installed ($(directory)/$(binary_name))"

      return 0
    else
      install_dotenvx
    fi
  fi
}

if ! is_test_mode; then
  run "$@"
  exit $?
fi

# "thanks for using dotenvx!" - mot
