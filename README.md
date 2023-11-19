![dotenv.org](https://dotenv.org/better-banner.png)

*better dotenv* from the creator of [`dotenv`](https://github.com/motdotla/dotenv).

* cross-platform
* multi-environment
* encrypted envs

&nbsp;


### Quickstart

```sh
brew install dotenv-org/brew/dotenv
```
> * [other ways to install](#other-ways-to-install)

&nbsp;

## Use Dotenv Anywhere

```
# .env
HELLO="World"
```
```
// index.js
console.log('Hello' + process.env.HELLO)
```
```sh
$ node index.js
Hello undefined

$ dotenv run -- node index.js
[dotenv@0.2.7][INFO] Injecting X environment variables into your application process
Hello World
```

## Install

Installing with [`brew`](https://brew.sh) is most straight forward:

```sh
brew install dotenv-org/brew/dotenv
```


### Other Ways to Install

1. After `brew`, installing globally using [`npm`](https://www.npmjs.com/package/@dotenv/dotenv) is easiest:

```sh
npm install @dotenv/dotenv --global
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

## Contributing

If you have questions or feedback:

* [github.com/dotenv-org/dotenv](https://github.com/dotenv-org/dotenv)
* [x.com/dotenvorg](https://x.com/dotenvorg) (DMs are open)
