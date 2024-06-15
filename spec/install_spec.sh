export CI=1 # because we are running this on github actions and makes testing output easier
export TEST_MODE=1 # set to test mode in order to not run run() for test purposes

Describe 'install.sh'
  Include install.sh

  setup() {
    VERSION="0.44.2"
    DIRECTORY="./spec/tmp"
  }

  # remove the dotenvx binary before each test
  cleanup() {
    rm -f ./spec/tmp/dotenvx
  }

  mock_home() {
    HOME="/home/testuser"
    DIRECTORY="~/testdir"
  }

  mock_unwritable_directory() {
    DIRECTORY="/usr/local/testing-installer" # requires root/sudo
  }

  mock_which_curl_empty() {
    echo ""

    return 0
  }

  mock_which_dotenvx_empty() {
    echo ""

    return 0
  }

  mock_which_dotenvx_path_different() {
    echo "/different/path"

    return 0
  }

  preinstall_dotenvx() {
    # Run the actual install_dotenvx function to install the binary
    install_dotenvx > /dev/null
  }

  BeforeEach 'setup'
  BeforeEach 'cleanup'
  AfterEach 'cleanup'

  Describe 'default values'
    It 'checks default VERSION'
      When call echo "$VERSION"
      The output should equal "0.44.2"
    End

    It 'checks default DIRECTORY'
      When call echo "$DIRECTORY"
      The output should equal "./spec/tmp"
    End
  End

  Describe 'is_piped()'
    It 'returns false'
      When call is_piped
      The status should equal 1
    End
  End

  Describe 'help_sudo_install_command'
    It 'returns sudo in front of command'
      When call help_sudo_install_command
      The status should equal 0
      The output should equal "sudo $0"
    End

    Describe 'when is_piped is true'
      is_piped() {
        return 0
      }

      It "returns with curl example"
        When call help_sudo_install_command
        The status should equal 0
        The output should equal "curl -sfS https://dotenvx.sh/install.sh | sudo $0"
      End
    End
  End

  Describe 'help_customize_directory_command'
    It 'returns with --directory flag'
      When call help_customize_directory_command
      The status should equal 0
      The output should equal "$0 --directory=."
    End

    Describe 'when is_piped is true'
      is_piped() {
        return 0
      }

      It "returns with curl example"
        When call help_customize_directory_command
        The status should equal 0
        The output should equal "curl -sfS https://dotenvx.sh/install.sh | $0 -s -- --directory=."
      End
    End
  End

  Describe 'is_ci()'
    It 'returns true'
      When call is_ci
      The status should equal 0
    End
  End

  Describe 'progress_bar()'
    It 'returns --no-progress-meter (because is_ci is true)'
      When call progress_bar
      The status should equal 0
      The output should equal "--no-progress-meter"
    End

    Describe 'when is_ci is true'
      mock_is_ci_false() {
        CI=0
      }

      Before 'mock_is_ci_false'

      It 'returns --progress-bar'
        When call progress_bar
        The status should equal 0
        The output should equal "--progress-bar"
      End
    End
  End

  Describe 'is_test_mode()'
    It 'returns true'
      When call is_test_mode
      The status should equal 0
    End

    Describe 'typical case when TEST_MODE is false'
      mock_is_test_mode_false() {
        TEST_MODE=0
      }

      Before 'mock_is_test_mode_false'

      It 'returns false'
        When call is_test_mode
        The status should equal 1
      End
    End
  End

  Describe 'usage()'
    It 'displays usage'
      When call usage
      The output should equal "Usage: $0 [options] [command]

install dotenvx – a better dotenv

Options:
  --directory       directory to install dotenvx to (default: \"/usr/local/bin\")
  --version         version of dotenvx to install (default: \"0.44.2\")

Commands:
  install           install dotenvx
  help              display help"
    End
  End

  Describe 'directory()'
    It 'smartly returns directory as default INSTALL_DIR'
      When call directory
      The output should equal "./spec/tmp"
    End

    Describe 'when home directory'
      Before 'mock_home'

      It 'expands ~ to home directory'
        When call directory
        The output should equal "/home/testuser/testdir"
      End
    End
  End

  Describe 'is_version_valid()'
    It 'is true (0)'
      When call is_version_valid
      The status should equal 0
    End

    Describe 'when VERSION blank'
      mock_version_blank() {
        VERSION=""
      }

      Before mock_version_blank

      It 'is false'
        When call is_version_valid
        The status should equal 1
        The output should equal "[INSTALLATION_FAILED] VERSION is blank in install.sh script
? set VERSION to valid semantic semver version and try again"
      End
    End

    Describe 'when VERSION invalid'
      mock_version_invalid() {
        VERSION="22"
      }

      Before mock_version_invalid

      It 'is false'
        When call is_version_valid
        The status should equal 1
        The output should equal "[INSTALLATION_FAILED] VERSION is not a valid semantic version in install.sh script
? set VERSION to valid semantic semver version and try again"
      End
    End
  End

  Describe 'is_directory_writable()'
    It 'is true (0)'
      When call is_directory_writable
      The status should equal 0
    End

    Describe 'when unwritable directory'
      Before 'mock_unwritable_directory'

      It 'is false (1) to /usr/local/testing-installer (typical case that /usr/local/testing-installer is not writable)'
        When call is_directory_writable
        The status should equal 1
        The output should equal "[INSTALLATION_FAILED] the installation directory [/usr/local/testing-installer] is not writable by the current user
? run as root [sudo $0] or choose a writable directory like your current directory [$0 --directory=.]"
      End
    End
  End

  Describe 'is_curl_installed()'
    It 'is true (0) (typical case that /usr/bin/curl is installed)'
      When call is_curl_installed
      The status should equal 0
    End

    Describe 'no curl'
      which_curl() {
        mock_which_curl_empty
      }

      It 'is false (1)'
        When call is_curl_installed
        The status should equal 1
        The output should equal "[INSTALLATION_FAILED] curl is required and is not installed
? install curl [$(help_install_curl_command)] and try again"
      End
    End
  End

  Describe 'os()'
    It 'returns current os lowercased'
      When call os
      The status should equal 0
      The output should equal "$(uname -s | tr '[:upper:]' '[:lower:]')"
    End
  End

  Describe 'arch()'
    It 'returns current arch lowercased'
      When call arch
      The status should equal 0
      The output should equal "$(uname -m | tr '[:upper:]' '[:lower:]')"
    End
  End

  Describe 'is_os_supported()'
    It 'returns true'
      When call is_os_supported
      The status should equal 0
    End
  End

  Describe 'is_arch_supported()'
    It 'returns true'
      When call is_arch_supported
      The status should equal 0
    End
  End

  Describe 'os_arch()'
    It 'returns the combined values'
      When call os_arch
      The status should equal 0
      The output should equal "$(uname -s | tr '[:upper:]' '[:lower:]')-$(uname -m | tr '[:upper:]' '[:lower:]')"
    End
  End

  Describe 'filename()'
    It 'returns the combined values'
      When call filename
      The status should equal 0
      The output should equal "dotenvx-0.44.2-$(uname -s | tr '[:upper:]' '[:lower:]')-$(uname -m | tr '[:upper:]' '[:lower:]').tar.gz"
    End
  End

  Describe 'download_url()'
    It 'returns the combined values'
      When call download_url
      The status should equal 0
      The output should equal "https://registry.npmjs.org/@dotenvx/dotenvx-$(uname -s | tr '[:upper:]' '[:lower:]')-$(uname -m | tr '[:upper:]' '[:lower:]')/-/dotenvx-$(uname -s | tr '[:upper:]' '[:lower:]')-$(uname -m | tr '[:upper:]' '[:lower:]')-0.44.2.tgz"
    End
  End

  Describe 'is_windows()'
    It 'returns false'
      When call is_windows
      The status should equal 1
    End

    Describe 'when on windows os'
      os() {
        echo "windows"

        return 0
      }

      It 'returns true'
        When call is_windows
        The status should equal 0
      End
    End
  End

  Describe 'is_installed()'
    which_dotenvx() {
      mock_which_dotenvx_empty
    }

    It 'returns false'
      When call is_installed
      The status should equal 1
    End

    Describe 'when already installed'
      Before 'preinstall_dotenvx'

      It 'returns true and outputs a message'
        When call is_installed
        The status should equal 0
        The output should equal "[dotenvx@0.44.2] already installed (./spec/tmp/dotenvx)"
      End
    End
  End

  Describe 'which_dotenvx()'
    which_dotenvx() {
      mock_which_dotenvx_empty
    }

    It 'returns empty space'
      When call which_dotenvx
      The output should equal ""
    End

    Describe 'when a different path'
      which_dotenvx() {
        mock_which_dotenvx_path_different
      }

      It 'returns the different path'
        When call which_dotenvx
        The output should equal "/different/path"
      End
    End
  End

  Describe 'warn_of_any_conflict()'
    which_dotenvx() {
      mock_which_dotenvx_empty
    }

    It 'does not warn since which dotenvx is empty'
      When call warn_of_any_conflict
      The status should equal 0
      The stderr should equal ""
      The output should equal ""
    End

    Describe 'when a different path'
      which_dotenvx() {
        mock_which_dotenvx_path_different
      }

      It 'warns'
        When call warn_of_any_conflict
        The status should equal 0
        The stderr should equal "[DOTENVX_CONFLICT] conflicting dotenvx found at /different/path
? we recommend updating your path to include ./spec/tmp"
      End
    End
  End

  Describe 'install_dotenvx()'
    which_dotenvx() {
      mock_which_dotenvx_empty
    }

    It 'installs it'
      When call install_dotenvx
      The status should equal 0
      The output should equal "[dotenvx@0.44.2] installed successfully (./spec/tmp/dotenvx)"
    End

    Describe 'when a different path'
      which_dotenvx() {
        mock_which_dotenvx_path_different
      }

      It 'installs it but warns'
        When call install_dotenvx
        The status should equal 0
        The output should equal "[dotenvx@0.44.2] installed successfully (./spec/tmp/dotenvx)"
        The stderr should equal "[DOTENVX_CONFLICT] conflicting dotenvx found at /different/path
? we recommend updating your path to include ./spec/tmp"
      End
    End
  End

  Describe 'run()'
    which_dotenvx() {
      mock_which_dotenvx_empty
    }

    It 'installs dotenvx'
      When call run
      The status should equal 0
      The output should equal "[dotenvx@0.44.2] installed successfully (./spec/tmp/dotenvx)"
    End

    Describe 'when a different path'
      which_dotenvx() {
        mock_which_dotenvx_path_different
      }

      It 'installs it but warns'
        When call run
        The status should equal 0
        The output should equal "[dotenvx@0.44.2] installed successfully (./spec/tmp/dotenvx)"
        The stderr should equal "[DOTENVX_CONFLICT] conflicting dotenvx found at /different/path
? we recommend updating your path to include ./spec/tmp"
      End
    End

    Describe 'when already installed at same location'
      Before 'preinstall_dotenvx'

      It 'says already installed'
        When call run
        The status should equal 0
        The output should equal "[dotenvx@0.44.2] already installed (./spec/tmp/dotenvx)"
      End
    End
  End
End
