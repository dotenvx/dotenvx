![dotenvx](https://dotenvx.com/better-banner.png)

*a better dotenv*–from the creator of [`dotenv`](https://github.com/motdotla/dotenv).

* run anywhere (cross-platform)
* multi-environment
* encrypted envs

&nbsp;


### Quickstart

Install and use it in code just like `dotenv`.

```sh
npm install @dotenvx/dotenvx --save
```
```js
// index.js
require('@dotenvx/dotenvx').config()

console.log(`Hello ${process.env.HELLO}`)
```

&nbsp;

Or install globally

```sh
brew install dotenvx/brew/dotenvx
```
> * [other global ways to install](https://dotenvx.com/docs/install)
>
> Intall globally as a cli to unlock dotenv for ANY language, framework, or platform. 💥
>
> I am using (and recommending) this approach going forward. – [motdotla](https://github.com/motdotla)

&nbsp;

## Run Anywhere

```sh
$ echo "HELLO=World" > .env
$ echo "console.log('Hello ' + process.env.HELLO)" > index.js

$ node index.js
Hello undefined

$ dotenvx run -- node index.js
Hello World
> :-D
```

see [extended quickstart guide](https://dotenvx.com/docs/quickstart)

More examples

* <details><summary>TypeScript 📘</summary><br>

  ```json
  // package.json
  {
    "type": "module",
    "dependencies": {
      "chalk": "^5.3.0"
    }
  }
  ```

  ```js
  // index.ts
  import chalk from 'chalk'
  console.log(chalk.blue(`Hello ${process.env.HELLO}`))
  ```

  ```sh
  $ npm install
  $ echo "HELLO=World" > .env

  $ dotenvx run -- npx tsx index.ts
  Hello World
  ```

  </details>

* <details><summary>Deno 🦕</summary><br>

  ```sh
  $ echo "HELLO=World" > .env
  $ echo "console.log('Hello ' + Deno.env.get('HELLO'))" > index.ts

  $ deno run --allow-env index.ts
  Hello undefined

  $ dotenvx run -- deno run --allow-env index.ts
  Hello World
  ```

* <details><summary>Bun 🥟</summary><br>

  ```sh
  $ echo "HELLO=Test" > .env.test
  $ echo "console.log('Hello ' + process.env.HELLO)" > index.js

  $ bun index.js
  Hello undefined

  $ dotenvx run -f .env.test -- bun index.js
  Hello Test
  ```

* <details><summary>Python 🐍</summary><br>

  ```sh
  $ echo "HELLO=World" > .env
  $ echo 'import os;print("Hello " + os.getenv("HELLO", ""))' > index.py

  $ dotenvx run -- python3 index.py
  Hello World
  ```

  see [extended python guide](https://dotenvx.com/docs/quickstart)

  </details>
* <details><summary>PHP 🐘</summary><br>

  ```sh
  $ echo "HELLO=World" > .env
  $ echo '<?php echo "Hello {$_SERVER["HELLO"]}\n";' > index.php

  $ dotenvx run -- php index.php
  Hello World
  ```

  see [extended php guide](https://dotenvx.com/docs/quickstart)

  </details>
* <details><summary>Ruby 💎</summary><br>

  ```sh
  $ echo "HELLO=World" > .env
  $ echo 'puts "Hello #{ENV["HELLO"]}"' > index.rb

  $ dotenvx run -- ruby index.rb
  Hello World
  ```

  see [extended ruby guide](https://dotenvx.com/docs/quickstart)

  </details>
* <details><summary>Go 🐹</summary><br>

  ```sh
  $ echo "HELLO=World" > .env
  $ echo 'package main; import ("fmt"; "os"); func main() { fmt.Printf("Hello %s\n", os.Getenv("HELLO")) }' > main.go

  $ dotenvx run -- go run main.go
  Hello World
  ```

  see [extended go guide](https://dotenvx.com/docs/quickstart)

  </details>
* <details><summary>Rust 🦀</summary><br>

  ```sh
  $ echo "HELLO=World" > .env
  $ echo 'fn main() {let hello = std::env::var("HELLO").unwrap_or("".to_string());println!("Hello {hello}");}' > src/main.rs

  $ dotenvx run -- cargo run
  Hello World
  ```

  see [extended rust guide](https://dotenvx.com/docs/quickstart)

  </details>
* <details><summary>Java ☕️</summary><br>

  ```sh
  $ echo "HELLO=World" > .env
  $ echo 'public class Index { public static void main(String[] args) { System.out.println("Hello " + System.getenv("HELLO")); } }' > index.java

  $ dotenvx run -- java index.java
  Hello World
  ```

  </details>
* <details><summary>.NET 🔵</summary><br>

  ```sh
  $ dotnet new console -n HelloWorld -o HelloWorld
  $ cd HelloWorld
  $ echo "HELLO=World" > .env
  $ echo 'Console.WriteLine($"Hello {Environment.GetEnvironmentVariable("HELLO")}");' > Program.cs

  $ dotenvx run -- dotnet run
  Hello World
  ```

  </details>
* <details><summary>Bash 🖥️</summary><br>

  ```sh
  $ echo "HELLO=World" > .env

  $ dotenvx run --quiet -- sh -c 'echo Hello $HELLO'
  Hello World
  ```

  </details>
* <details><summary>Cron ⏰</summary><br>

  ```sh
  # run every day at 8am
  0 8 * * * dotenvx run -- /path/to/myscript.sh
  ```

  </details>
* <details><summary>Frameworks ▲</summary><br>

  ```sh
  $ dotenvx run -- next dev
  $ dotenvx run -- npm start
  $ dotenvx run -- bin/rails s
  $ dotenvx run -- php artisan serve
  ```

  see [framework guides](https://dotenvx.com/docs#frameworks)

  </details>
* <details><summary>Docker 🐳</summary><br>

  ```sh
  $ docker run -it --rm -v $(pwd):/app dotenv/dotenvx run -- node index.js
  ```

  Or in any image:

  ```sh
  FROM node:latest
  RUN echo "HELLO=World" > .env && echo "console.log('Hello ' + process.env.HELLO)" > index.js
  RUN curl -fsS https://dotenvx.sh/ | sh
  CMD ["dotenvx", "run", "--", "echo", "Hello $HELLO"]
  ```

  see [docker guide](https://dotenvx.com/docs/platforms/docker)

  </details>

* <details><summary>CI/CDs 🐙</summary><br>

  ```yaml
  name: build
  on: [push]
  jobs:
    build:
      runs-on: ubuntu-latest
      steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 16
      - run: curl -fsS https://dotenvx.sh/ | sh
      - run: dotenvx run -- node build.js
        env:
          DOTENV_KEY: ${{ secrets.DOTENV_KEY }}
  ```

  see [github actions guide](https://dotenvx.com/docs/cis/github-actions)

  </details>
* <details><summary>Platforms</summary><br>

  ```sh
  # heroku
  heroku buildpacks:add https://github.com/dotenvx/heroku-buildpack-dotenvx

  # docker
  RUN curl -fsS https://dotenvx.sh/ | sh

  # vercel
  npm install @dotenvx/dotenvx --save
  ```

  see [platform guides](https://dotenvx.com/docs#platforms)

  </details>
* <details><summary>Process Managers</summary><br>

  ```js
  // pm2
  "scripts": {
    "start": "dotenvx run -- pm2-runtime start ecosystem.config.js --env production"
  },
  ```

  see [process manager guides](https://dotenvx.com/docs#process-managers)

  </details>

* <details><summary>npx</summary><br>

  ```sh
  # alternatively use npx
  $ npx @dotenvx/dotenvx run -- node index.js
  $ npx @dotenvx/dotenvx run -- next dev
  $ npx @dotenvx/dotenvx run -- npm start
  ```

  </details>
* <details><summary>npm</summary><br>

  ```sh
  $ npm install @dotenvx/dotenvx --save
  ```

  ```json
  {
    "scripts": {
      "start": "./node_modules/.bin/dotenvx run -- node index.js"
    },
    "dependencies": {
      "@dotenvx/dotenvx": "^0.5.0"
    }
  }
  ```

  ```sh
  $ npm run start

  > start
  > ./node_modules/.bin/dotenvx run -- node index.js

  [dotenvx][info] loading env (1) from .env
  Hello World
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
* <details><summary>Variable Expansion</summary><br>

  Reference and expand variables already on your machine for use in your .env file.

  ```ini
  # .env
  USERNAME="username"
  DATABASE_URL="postgres://${USERNAME}@localhost/my_database"
  ```
  ```js
  // index.js
  console.log('DATABASE_URL', process.env.DATABASE_URL)
  ```
  ```sh
  $ dotenvx run --debug -- node index.js
  [dotenvx@0.14.1] injecting env (2) from .env
  DATABASE_URL postgres://username@localhost/my_database
  ```

  </details>
* <details><summary>Command Substitution</summary><br>

  Add the output of a command to one of your variables in your .env file.

  ```ini
  # .env
  DATABASE_URL="postgres://$(whoami)@localhost/my_database"
  ```
  ```js
  // index.js
  console.log('DATABASE_URL', process.env.DATABASE_URL)
  ```
  ```sh
  $ dotenvx run --debug -- node index.js
  [dotenvx@0.14.1] injecting env (1) from .env
  DATABASE_URL postgres://yourusername@localhost/my_database
  ```

  </details>


&nbsp;

## Multiple Environments

> Create a `.env.production` file and use `-f` to load it. It's straightforward, yet flexible.
```sh
$ echo "HELLO=production" > .env.production
$ echo "console.log('Hello ' + process.env.HELLO)" > index.js

$ dotenvx run -f .env.production -- node index.js
[dotenvx][info] loading env (1) from .env.production
Hello production
> ^^
```

More examples

* <details><summary>multiple `.env` files</summary><br>

  ```sh
  $ echo "HELLO=local" > .env.local

  $ echo "HELLO=World" > .env

  $ dotenvx run -f .env.local -f .env -- node index.js
  [dotenvx][info] loading env (1) from .env.local,.env
  Hello local
  ```

  </details>

* <details><summary>`--overload` flag</summary><br>

  ```sh
  $ echo "HELLO=local" > .env.local

  $ echo "HELLO=World" > .env

  $ dotenvx run -f .env.local -f .env --overload -- node index.js
  [dotenvx][info] loading env (1) from .env.local,.env
  Hello World
  ```

* <details><summary>`--verbose` flag</summary><br>

  ```sh
  $ echo "HELLO=production" > .env.production

  $ dotenvx run -f .env.production --verbose -- node index.js
  [dotenvx][verbose] injecting env from /path/to/.env.production
  [dotenvx][verbose] HELLO set
  [dotenvx][info] loading env (1) from .env.production
  Hello production
  ```

* <details><summary>`--debug` flag</summary><br>

  ```sh
  $ echo "HELLO=production" > .env.production

  $ dotenvx run -f .env.production --debug -- node index.js
  [dotenvx][debug] configuring options
  [dotenvx][debug] {"envFile":[".env.production"]}
  [dotenvx][verbose] injecting env from /path/to/.env.production
  [dotenvx][debug] reading env from /path/to/.env.production
  [dotenvx][debug] parsing env from /path/to/.env.production
  [dotenvx][debug] {"HELLO":"production"}
  [dotenvx][debug] writing env from /path/to/.env.production
  [dotenvx][verbose] HELLO set
  [dotenvx][debug] HELLO set to production
  [dotenvx][info] loading env (1) from .env.production
  Hello production
  ```

  </details>
* <details><summary>`--quiet` flag</summary><br>

  Use `--quiet` to suppress all output (except errors).

  ```sh
  $ echo "HELLO=production" > .env.production

  $ dotenvx run -f .env.production --quiet -- node index.js
  Hello production
  ```

  </details>
* <details><summary>`--log-level` flag</summary><br>

  Set `--log-level` to whatever you wish. For example, to supress warnings (risky), set log level to `error`:

  ```sh
  $ echo "HELLO=production" > .env.production

  $ dotenvx run -f .env.production --log-level=error -- node index.js
  Hello production
  ```

  Available log levels are `error, warn, info, verbose, debug, silly`

  </details>


&nbsp;

## Encryption

> Encrypt your secrets to a `.env.vault` file and load from it (recommended for production and ci).
```sh
$ echo "HELLO=World" > .env
$ echo "HELLO=production" > .env.production
$ echo "console.log('Hello ' + process.env.HELLO)" > index.js

$ dotenvx encrypt
[dotenvx][info] encrypted to .env.vault (.env,.env.production)
[dotenvx][info] keys added to .env.keys (DOTENV_KEY_PRODUCTION,DOTENV_KEY_PRODUCTION)

$ DOTENV_KEY='<dotenv_key_production>' dotenvx run -- node index.js
[dotenvx][info] loading env (1) from encrypted .env.vault
Hello production
^ :-]
```

More examples

* <details><summary>AWS Lambda</summary><br>

  ```sh
  coming soon
  ```

  </details>

* <details><summary>Digital Ocean</summary><br>

  ```sh
  coming soon
  ```

  </details>

* <details><summary>Docker 🐳</summary><br>

  > Add the `dotenvx` binary to your Dockerfile

  ```sh
  # Install dotenvx
  RUN curl -fsS https://dotenvx.sh/ | sh
  ```

  > Use it in your Dockerfile CMD

  ```sh
  # Prepend dotenvx run
  CMD ["dotenvx", "run", "--", "node", "index.js"]
  ```

  see [docker guide](https://dotenvx.com/docs/platforms/docker)

  </details>

* <details><summary>Fly.io 🎈</summary><br>

  > Add the `dotenvx` binary to your Dockerfile

  ```sh
  # Install dotenvx
  RUN curl -fsS https://dotenvx.sh/ | sh
  ```

  > Use it in your Dockerfile CMD

  ```sh
  # Prepend dotenvx run
  CMD ["dotenvx", "run", "--", "node", "index.js"]
  ```

  see [fly guide](https://dotenvx.com/docs/platforms/fly)

  </details>

* <details><summary>Heroku 🟣</summary><br>

  > Add the buildpack, installing the `dotenvx` binary to your heroku deployment.

  ```sh
  heroku buildpacks:add https://github.com/dotenvx/heroku-buildpack-dotenvx
  ```

  > Use it in your Procfile.

  ```sh
  web: dotenvx run -- node index.js
  ```

  see [heroku guide](https://dotenvx.com/docs/platforms/heroku)

  </details>

* <details><summary>Laravel Forge</summary><br>

  ```sh
  coming soon
  ```

  </details>

* <details><summary>Netlify 🔷</summary><br>

  > Add the `dotenvx` npm module

  ```sh
  npm install @dotenvx/dotenvx --save
  ```

  > Use it in your `package.json scripts`

  ```json
  "scripts": {
    "dotenvx": "dotenvx",
    "dev": "dotenvx run -- next dev --turbo",
    "build": "dotenvx run -- next build",
    "start": "dotenvx run -- next start"
  },
  ```

  see [netlify guide](https://dotenvx.com/docs/platforms/netlify)

  </details>

* <details><summary>Railway 🚄</summary><br>

  > Add the `dotenvx` binary to your Dockerfile

  ```sh
  # Install dotenvx
  RUN curl -fsS https://dotenvx.sh/ | sh
  ```

  > Use it in your Dockerfile CMD

  ```sh
  # Prepend dotenvx run
  CMD ["dotenvx", "run", "--", "node", "index.js"]
  ```

  see [railway guide](https://dotenvx.com/docs/platforms/railway)

  </details>

* <details><summary>Render</summary><br>

  ```sh
  coming soon
  ```

  </details>

* <details><summary>Vercel ▲</summary><br>

  > Add the `dotenvx` npm module

  ```sh
  npm install @dotenvx/dotenvx --save
  ```

  > Use it in your `package.json scripts`

  ```json
  "scripts": {
    "dotenvx": "dotenvx",
    "dev": "dotenvx run -- next dev --turbo",
    "build": "dotenvx run -- next build",
    "start": "dotenvx run -- next start"
  },
  ```

  see [vercel guide](https://dotenvx.com/docs/platforms/vercel)

  </details>

* <details><summary>CircleCI</summary><br>

  ```sh
  coming soon
  ```

  </details>

* <details><summary>GitHub Actions 🐙</summary><br>

  > Add the `dotenvx` binary to GitHub Actions

  ```sh
  name: build
  on: [push]
  jobs:
    build:
      runs-on: ubuntu-latest
      steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 16
      - run: curl -fsS https://dotenvx.sh/ | sh
      - run: dotenvx run -- node build.js
        env:
          DOTENV_KEY: ${{ secrets.DOTENV_KEY }}
  ```

  see [github actions guide](https://dotenvx.com/docs/cis/github-actions)

  </details>

&nbsp;

## Hub

> Integrate tightly with [GitHub](https://github.com) 🐙 and as a team
```sh
$ dotenvx hub login
$ dotenvx hub push
```

**beta**: more details coming soon.

&nbsp;

## More features

> Keep your `.env` files safe

* [`dotenvx genexample`](https://dotenvx.com/docs/features/genexample) – generate `.env.example` file
* [`dotenvx gitignore`](https://dotenvx.com/docs/features/gitignore) – gitignore your `.env` files
* [`dotenvx prebuild`](https://dotenvx.com/docs/features/prebuild) – prevent `.env` files from being built into your docker container
* [`dotenvx precommit`](https://dotenvx.com/docs/features/precommit) – prevent `.env` files from being committed to code
* [`dotenvx scan`](https://dotenvx.com/docs/features/scan) – scan for leaked secrets in code

> Convenience

* [`dotenvx get`](https://dotenvx.com/docs/features/get) – return a single environment variable
* [`dotenvx ls`](https://dotenvx.com/docs/features/ls) – list all .env files in your repo
* [`dotenvx settings`](https://dotenvx.com/docs/features/settings) – print current dotenvx settings

&nbsp;

## Guides

* [quickstart guides](https://dotenvx.com/docs/quickstart)
  * [run anywhere](https://dotenvx.com/docs/quickstart/run)
  * [multi-environment](https://dotenvx.com/docs/quickstart/environments)
  * [encrypted envs](https://dotenvx.com/docs/quickstart/encryption)
* [dotenvx/docs](https://dotenvx.com/docs)
  * [languages](https://dotenvx.com/docs#languages)
  * [frameworks](https://dotenvx.com/docs#frameworks)
  * [platforms](https://dotenvx.com/docs#platforms)
  * [ci/cd](https://dotenvx.com/docs#cis)

&nbsp;

## FAQ

#### Why am I getting the error `node: .env: not found`?

You are using Node 20 or greater and it adds a differing implementation of `--env-file` flag support. Rather than warn on a missing `.env` file (like dotenv has historically done), it raises an error: `node: .env: not found`.

This fix is easy. Replace `--env-file` with `-f`.

```bash
# from this:
./node_modules/.bin/dotenvx run --env-file .env -- yourcommand
# to this:
./node_modules/.bin/dotenvx run -f .env -- yourcommand
```

[more context](https://github.com/dotenvx/dotenvx/issues/131)

&nbsp;

## Contributing

You can fork this repo and create [pull requests](https://github.com/dotenvx/dotenvx/pulls) or if you have questions or feedback:

* [github.com/dotenvx/dotenvx](https://github.com/dotenvx/dotenvx/issues) - bugs and discussions
* [@dotenvx 𝕏](https://x.com/dotenvx) (DMs are open)
