![dotenv.org](https://dotenv.org/better-banner.png)

*better dotenv*–from the creator of [`dotenv`](https://github.com/motdotla/dotenv).

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

```sh
$ echo "HELLO=World" > .env && echo "console.log('Hello ' + process.env.HELLO)" > index.js

$ node index.js
Hello undefined

$ dotenv run -- node index.js
Hello World
> :-D
```

More examples

* <details><summary>python</summary><br>

  ```sh
  $ echo 'import os;print("Hello " + os.getenv("HELLO", ""))' > index.py

  $ dotenv run -- python3 index.py
  Hello World
  ```

  </details>
* <details><summary>php</summary><br>

  ```sh
  $ echo '<?php echo "Hello {$_SERVER["HELLO"]}\n";' > index.php

  $ dotenv run -- php index.php
  Hello World
  ```

  </details>
* <details><summary>ruby</summary><br>

  ```sh
  $ echo 'puts "Hello #{ENV["HELLO"]}"' > index.rb

  $ dotenv run -- ruby index.rb
  Hello World
  ```

  </details>

* <details><summary>web frameworks</summary><br>

  ```sh
  $ dotenv run -- next dev
  $ dotenv run -- npm start
  $ dotenv run -- bin/rails s
  $ dotenv run -- php artisan serve
  ```

  </details>

* <details><summary>npx</summary><br>

  ```sh
  # alternatively use npx
  $ npx @dotenv/dotenv run -- node index.js
  $ npx @dotenv/dotenv run -- next dev
  $ npx @dotenv/dotenv run -- npm start
  ```

  </details>

* <details><summary>git</summary><br>

  ```sh
  # use as a git submodule
  $ git dotenv run -- node index.js
  $ git dotenv run -- next dev
  $ git dotenv run -- npm start
  ```

  </details>


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

2. Or use with [`npx`](https://www.npmjs.com/package/npx):

```sh
npx @dotenv/dotenv help
```

3. dotenv is a standalone binary, so (if you want) you can just download it directly:

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
