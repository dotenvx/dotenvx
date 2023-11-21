![dotenvx](https://dotenv.org/better-banner.png)

*a better dotenv*–from the creator of [`dotenv`](https://github.com/motdotla/dotenv).

* run anywhere (cross-platform)
* multi-environment
* encrypted envs

&nbsp;


### Quickstart

```sh
brew install dotenvx/brew/dotenvx
```
> * [other ways to install](#other-ways-to-install)

&nbsp;

## Run Anywhere

```sh
$ echo "HELLO=World" > .env && echo "console.log('Hello ' + process.env.HELLO)" > index.js

$ node index.js
Hello undefined

$ dotenvx run -- node index.js
Hello World
> :-D
```

More examples

* <details><summary>Python 🐍</summary><br>

  ```sh
  $ echo 'import os;print("Hello " + os.getenv("HELLO", ""))' > index.py

  $ dotenvx run -- python3 index.py
  Hello World
  ```

  </details>
* <details><summary>PHP 🐘</summary><br>

  ```sh
  $ echo '<?php echo "Hello {$_SERVER["HELLO"]}\n";' > index.php

  $ dotenvx run -- php index.php
  Hello World
  ```

  </details>
* <details><summary>Ruby 💎</summary><br>

  ```sh
  $ echo 'puts "Hello #{ENV["HELLO"]}"' > index.rb

  $ dotenvx run -- ruby index.rb
  Hello World
  ```

  </details>
* <details><summary>Rust 🦀</summary><br>

  ```sh
  $ echo 'fn main() {let hello = std::env::var("HELLO").unwrap_or("".to_string());println!("Hello {hello}");}' > src/main.rs

  $ dotenvx run -- cargo run
  Hello World
  ```

  </details>
* <details><summary>Frameworks ▲</summary><br>

  ```sh
  $ dotenvx run -- next dev
  $ dotenvx run -- npm start
  $ dotenvx run -- bin/rails s
  $ dotenvx run -- php artisan serve
  ```

  </details>
* <details><summary>Docker 🐳</summary><br>

  ```sh
  # run as a command-line tool
  docker run -it --rm -v $(pwd):/app dotenv/dotenvx run -- node index.js
  ```

  ```sh
  # include in a Dockerfile
  # example coming soon
  ```

  </details>

* <details><summary>CI/CDs 🐙</summary><br>

  ```sh
  examples coming soon
  ```

  </details>
* <details><summary>Platforms</summary><br>

  ```sh
  examples coming soon
  ```

  </details>
* <details><summary>npx</summary><br>

  ```sh
  # alternatively use npx
  $ npx @dotenvx/dotenvx run -- node index.js
  $ npx @dotenvx/dotenvx run -- next dev
  $ npx @dotenvx/dotenvx run -- npm start
  ```

  </details>
* <details><summary>Git</summary><br>

  ```sh
  # use as a git submodule
  $ git dotenvx run -- node index.js
  $ git dotenvx run -- next dev
  $ git dotenvx run -- npm start
  ```

  </details>

&nbsp;

## Multiple Environments

Pass the `--env-file` flag (shorthand `-f`) to run any environment from a `.env.environment` file.

```sh
$ dotenvx run --env-file=.env.production -- node index.js
[dotenvx][INFO] Injecting 12 production environment variables into your application process
```

Combine multiple `.env` files if you like.

```
$ dotenvx run --env-file=.env.local --env-file=.env -- node index.js
[dotenvx][INFO] Injecting 12 local, 1 development environment variables into your application process
```

&nbsp;

## Encrypt Your Env Files

WIP

&nbsp;

## Usage

### Guide

Begin by creating a simple 'hello world' program.

```js
// index.js
console.log(`Hello ${process.env.HELLO}`)
```

Run it.

```js
$ node index.js
Hello undefined
```

Run it with `dotenvx`.

```sh
$ dotenvx run -- node index.js
[dotenvx@x.x.x][WARN] ENOENT: no such file or directory, open '/../../.env'
Hello undefined
```

It warns you when there is no `.env` file (pass the `--quiet` flag to suppress these warnings).

Create the `.env` file.

```ini
# env
JELLO="World"
```

Run it again.

```sh
$ dotenvx run -- node index.js
[dotenvx@x.x.x][INFO] Injecting 0 environment variables into your application process
Hello undefined
```

Hrm, still undefined. Pass the `--debug` flag to debug the issue. I'll give you a hint: 🍮

```sh
$ dotenvx run --debug -- node index.js
[dotenvx@x.x.x][VERBOSE] Loading env from /../../.env
[dotenvx@x.x.x][DEBUG] Reading env from /../../.env
[dotenvx@x.x.x][DEBUG] Parsing env from /../../.env
[dotenvx@x.x.x][DEBUG] {"JELLO":"World"}

# Oops, HELLO not JELLO ^^
```

Fix your `.env` file.

```ini
# .env
HELLO="World"
```

One last time. [Le tired](https://youtu.be/kCpjgl2baLs?t=45).

```sh
$ dotenvx run -- node index.js
[dotenvx@x.x.x][INFO] Injecting 0 environment variables into your application process
Hello undefined
```

&nbsp;


## Install

Installing with [`brew`](https://brew.sh) is most straight forward:

```sh
brew install dotenvx/brew/dotenvx
```

### Other Ways to Install

1. After `brew`, installing globally using [`npm`](https://www.npmjs.com/package/@dotenvx/dotenvx) is easiest:

```sh
npm install @dotenvx/dotenvx --global
```

2. Or use with [`npx`](https://www.npmjs.com/package/npx):

```sh
npx @dotenvx/dotenvx help
```

3. dotenvx is a standalone binary, so (if you want) you can just download it directly:

```sh
# download it to `./dotenvx`
curl -Lo ./dotenvx --compressed -f --proto '=https' https://github.com/dotenvx/dotenvx/releases/latest/download/dotenvx-$(uname)-$(uname -m).tar.gz

# install it to `/usr/local/bin/dotenvx`
sudo install -m 755 dotenvx /usr/local/bin

# check it works
dotenvx --help
```

## Contributing

If you have questions or feedback:

* [github.com/dotenvx/dotenvx](https://github.com/dotenvx/dotenvx) - bugs and discussions
* [@dotenvx 𝕏](https://x.com/dotenvx) (DMs are open)
