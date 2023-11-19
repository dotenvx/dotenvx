# @dotenv/dotenv

“dotenv made better“ from the creator of [`dotenv`](https://github.com/motdotla/dotenv).

## Quickstart

```sh
brew install dotenv-org/brew/dotenv
```
> * [other ways to install](#install)

## Install

Installing with [`brew`](https://brew.sh) is most straight forward:

```sh
brew install dotenv-org/brew/dotenv
```

### Other Ways to Install

1. After `brew` installing globally with [`npm`](https://www.npmjs.com/package/@dotenv/dotenv) is easiest:

```sh
npm install @dotenv/dotenv --global
```

Or use [`npx`](https://docs.npmjs.com/cli/v8/commands/npx):

```sh
npx dotenv --help
```

2. dotenv is a standalone binary, so (if you want) you can just download it directly:

```sh
# download it to `./dotenv`
curl -Lo ./dotenv --compressed -f --proto '=https' https://github.com/dotenv-org/dotenv/releases/latest/download/dotenv-$(uname)-$(uname -m).tar.gz

# install it to `/usr/local/bin/dotenv`
sudo install -m 755 dotenv /usr/local/bin

# check it works
dotenv --help
```


