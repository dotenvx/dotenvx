![dotenv.org](https://dotenv.org/better-banner.png)

*better dotenv* from the creator of [`dotenv`](https://github.com/motdotla/dotenv).

* run anywhere (cross-platform)
* multi-environment
* encrypted envs

&nbsp;


### Quickstart

```sh
brew install dotenv-org/brew/dotenv
```
> * [other ways to install](#other-ways-to-install)

&nbsp;

## Run Anywhere

> One tool that works everywhere. Consistent and predictable loading of your environments across your entire infrastructure and organization.

`node`

```sh
# .env, index.js
$ echo "HELLO=World" > .env && echo "console.log('Hello ' + process.env.HELLO)" > index.js

$ node index.js
Hello undefined

$ dotenv run -- node index.js
Hello World
# ^^ Your environment variable(s) are injected into your application process just in time
```

`python`

```sh
$ echo "import os;print("Hello " + os.getenv("HELLO", ''))" > index.py

$ python3 index.py
Hello

$ dotenv run -- python3 index.py
Hello World
# ^ Success
# 
# import os
# print("Hello " + os.getenv("HELLO", ''))
```

`next.js/rails/laravel/[your fav framework]`

```sh
# next.js
$ dotenv run -- next dev
[dotenv][INFO] Injecting 13 environment variables into your application process

# rails
$ dotenv run -- bin/rails s
[dotenv][INFO] Injecting 7 environment variables into your application process

# laravel
$ dotenv run -- php artisan serve
[dotenv][INFO] Injecting 16 environment variables into your application process

# ..more
```

> Just put `dotenv run --` before your application start command. It works with *any language, framework, or platform*. 

&nbsp;

## Multiple Environments

Pass the `--env-file` flag (shorthand `-f`) to run any environment from a `.env.environment` file.

```sh
$ dotenv run --env-file=.env.production -- node index.js
[dotenv][INFO] Injecting 12 production environment variables into your application process
```

Combine multiple `.env` files if you like.

```
$ dotenv run --env-file=.env.local --env-file=.env -- node index.js
[dotenv][INFO] Injecting 12 local, 1 development environment variables into your application process
```

&nbsp;

## Encrypt Your Env Files

WIP

&nbsp;

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

* [github.com/dotenv-org/dotenv](https://github.com/dotenv-org/dotenv) - bugs and discussions
* [x.com/dotenvorg](https://x.com/dotenvorg) (DMs are open)
