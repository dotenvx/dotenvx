[![dotenvx](https://dotenvx.com/banner.png?v2)](https://dotenvx.com)

*a secure dotenv*–from the creator of [`dotenv`](https://github.com/motdotla/dotenv).

* run anywhere (cross-platform)
* multi-environment
* encrypted envs

[Read the whitepaper](https://dotenvx.com/dotenvx.pdf?v=README)

&nbsp;


### Quickstart [![npm version](https://img.shields.io/npm/v/@dotenvx/dotenvx.svg)](https://www.npmjs.com/package/@dotenvx/dotenvx) [![downloads](https://img.shields.io/npm/dw/@dotenvx/dotenvx)](https://www.npmjs.com/package/@dotenvx/dotenvx)

Install and use it in code just like `dotenv`.

```sh
npm install @dotenvx/dotenvx --save
```
```js
// index.js
require('@dotenvx/dotenvx').config()
// or import '@dotenvx/dotenvx/config' // for esm

console.log(`Hello ${process.env.HELLO}`)
```

&nbsp;

or install globally - *unlocks dotenv for any language, framework, or platform!*

<details><summary>with npm 🌍</summary><br>

```sh
npm i -g @dotenvx/dotenvx
dotenvx encrypt
```

[![npm installs](https://img.shields.io/npm/dt/@dotenvx/dotenvx)](https://npmjs.com/@dotenvx/dotenvx)

&nbsp;

</details>
<details><summary>with curl 🌐</summary><br>

```sh
curl -sfS https://dotenvx.sh | sh
dotenvx encrypt
```

[![curl installs](https://img.shields.io/endpoint?url=https://dotenvx.sh/stats/curl&label=curl%20installs)](https://github.com/dotenvx/dotenvx.sh/blob/main/install.sh)

&nbsp;

</details>

<details><summary>with brew 🍺</summary><br>

```sh
brew tap dotenvx/brew
brew trust dotenvx/brew
brew install dotenvx
dotenvx encrypt
```

[![brew installs](https://img.shields.io/github/downloads/dotenvx/dotenvx/total?label=brew%20installs)](https://github.com/dotenvx/homebrew-brew/blob/main/Formula/dotenvx.rb)

&nbsp;

</details>

<details><summary>with docker 🐳</summary><br>

```sh
docker run -it --rm -v $(pwd):/app dotenv/dotenvx encrypt
```

[![docker pulls](https://img.shields.io/docker/pulls/dotenv/dotenvx)](https://hub.docker.com/r/dotenv/dotenvx)

&nbsp;

</details>

<details><summary>with github releases 🐙</summary><br>

```sh
curl -L -o dotenvx.tar.gz "https://github.com/dotenvx/dotenvx/releases/latest/download/dotenvx-$(uname -s)-$(uname -m).tar.gz"
tar -xzf dotenvx.tar.gz
./dotenvx encrypt
```

[![github releases](https://img.shields.io/github/downloads/dotenvx/dotenvx/total)](https://github.com/dotenvx/dotenvx/releases)

&nbsp;

</details>


<details><summary>or windows 🪟</summary><br>

```sh
winget install dotenvx
dotenvx encrypt
```

</details>

&nbsp;

## Run Anywhere

```sh
$ echo "HELLO=World" > .env
$ echo "console.log('Hello ' + process.env.HELLO)" > index.js

$ node index.js
Hello undefined # without dotenvx

$ dotenvx run -- node index.js
Hello World # with dotenvx
> :-D
```

see [quickstart guides](https://dotenvx.com/docs/quickstart)

More examples

<details><summary>Claude 🤖</summary><br>

Run Claude with your real secrets while redacting them from its output.

```sh
$ echo "HELLO=World" > .env

$ dotenvx run --redact -- claude -p 'Run `dotenvx get HELLO` and echo back just Hello VALUE' --dangerously-skip-permissions
Hello [REDACTED]
```

see [Claude redaction guide](https://dotenvx.com/docs/cli/run-redact-claude-print)

</details>
<details><summary>Codex ✨</summary><br>

Run Codex with your real secrets while redacting them from its output.

```sh
$ echo "HELLO=World" > .env

$ dotenvx run --redact -- codex exec 'Run `dotenvx get HELLO` and echo back just Hello VALUE' --skip-git-repo-check
Hello [REDACTED]
```

see [Codex redaction guide](https://dotenvx.com/docs/cli/run-redact-codex-exec)

</details>
<details><summary>1Password 🔐</summary><br>

Run with secrets resolved directly from 1Password.

```sh
$ echo "HELLO=op://Personal/hello/password" > .env
$ dotenvx run -- sh -c 'echo Hello $HELLO'
Hello World
```

see [1Password guide](https://dotenvx.com/docs/secrets-in-1password)

</details>
<details><summary>Bitwarden 🛡️</summary><br>

Run with secrets resolved directly from Bitwarden Password Manager.

```sh
$ echo 'HELLO="bw://My Hello Login/password"' > .env
$ dotenvx run -- sh -c 'echo Hello $HELLO'
Hello World
```

Install the [Bitwarden Password Manager CLI](https://bitwarden.com/help/cli/) before running dotenvx.

</details>
<details><summary>TypeScript 📘</summary><br>

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
<details><summary>Astro 🚀</summary><br>

Preface Astro scripts with `dotenvx run --` and read your env values in Astro.

```json
{
  "scripts": {
    "dev": "dotenvx run -- astro dev",
    "build": "dotenvx run -- astro build",
    "preview": "dotenvx run -- astro preview"
  }
}
```

```astro
export async function GET() {
  return new Response(
    JSON.stringify({
      HELLO: process.env.HELLO,
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
}
```

see [astro guide](https://dotenvx.com/docs/secrets-in-astro)

</details>
<details><summary>Expo 🧭</summary><br>

Preface Expo scripts with `dotenvx run --`.

```json
{
  "scripts": {
    "start": "dotenvx run -- expo start",
    "reset-project": "node ./scripts/reset-project.js",
    "android": "dotenvx run -- expo start --android",
    "ios": "dotenvx run -- expo start --ios",
    "web": "dotenvx run -- expo start --web",
    "lint": "expo lint"
  }
}
```

see [expo guide](https://dotenvx.com/docs/secrets-in-expo)

</details>
<details><summary>Next.js ▲</summary><br>

Install Dotenvx and `@dotenvx/next-env`.

```sh
$ npm install @dotenvx/dotenvx
$ npm install @dotenvx/next-env
```

Override `@next/env` in your `package.json`.

```json
{
  "overrides": {
    "@next/env": "npm:@dotenvx/next-env"
  }
}
```

Encrypt your `.env` file.

```sh
$ npx dotenvx encrypt
◈ encrypted (.env)
```

Your encrypted secrets are automatically injected and readable in Next.js.

```ts
import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    HELLO: process.env.HELLO
  })
}
```

Set `DOTENV_PRIVATE_KEY` in production before deploying.

</details>
<details><summary>Cloudflare Workers ⛅️</summary><br>

```sh
$ dotenvx encrypt -f .env.txt
```

```js
// src/index.js
import envSrc from '../.env.txt'
import dotenvx from '@dotenvx/dotenvx'

const config = dotenvx.config({ envs: [{ type: 'env', value: envSrc, privateKeyName: 'DOTENV_PRIVATE_KEY' }] })
const envx = config.parsed

export default {
  async fetch(request, env, ctx) {
    return new Response(`Hello ${envx.HELLO}`)
  }
}
```
```json
"scripts": {
  "deploy": "wrangler deploy",
  "dev": "wrangler dev --var $(dotenvx keypair -f .env.txt --format=colon)",
  "start": "wrangler dev --var $(dotenvx keypair -f .env.txt --format=colon)",
}
```

</details>
<details><summary>Bun 🥟</summary><br>

```sh
$ echo "HELLO=Test" > .env.test
$ echo "console.log('Hello ' + process.env.HELLO)" > index.js

$ bun index.js
Hello undefined

$ dotenvx run -f .env.test -- bun index.js
Hello Test
```

</details>
<details><summary>Deno 🦕</summary><br>

```sh
$ echo "HELLO=World" > .env
$ echo "console.log('Hello ' + Deno.env.get('HELLO'))" > index.ts

$ deno run --allow-env index.ts
Hello undefined

$ dotenvx run -- deno run --allow-env index.ts
Hello World
```

> [!WARNING]
> Some of you are attempting to use the npm module directly with `deno run`. Don't, because deno currently has incomplete support for these encryption ciphers.
>
> ```
> $ deno run -A npm:@dotenvx/dotenvx encrypt
> Unknown cipher
> ```
> 
> Instead, use `dotenvx` as designed, by installing the cli as a binary - via curl, brew, etc.

</details>
<details><summary>Python 🐍</summary><br>

```sh
$ echo "HELLO=World" > .env
$ echo 'import os;print("Hello " + os.getenv("HELLO", ""))' > index.py

$ dotenvx run -- python3 index.py
Hello World
```

see [extended python guide](https://dotenvx.com/docs/quickstart)

</details>
<details><summary>PHP 🐘</summary><br>

```sh
$ echo "HELLO=World" > .env
$ echo '<?php echo "Hello {$_SERVER["HELLO"]}\n";' > index.php

$ dotenvx run -- php index.php
Hello World
```

see [extended php guide](https://dotenvx.com/docs/quickstart)

</details>
<details><summary>Ruby 💎</summary><br>

```sh
$ echo "HELLO=World" > .env
$ echo 'puts "Hello #{ENV["HELLO"]}"' > index.rb

$ dotenvx run -- ruby index.rb
Hello World
```

see [extended ruby guide](https://dotenvx.com/docs/quickstart)

</details>
<details><summary>Go 🐹</summary><br>

```sh
$ echo "HELLO=World" > .env
$ echo 'package main; import ("fmt"; "os"); func main() { fmt.Printf("Hello %s\n", os.Getenv("HELLO")) }' > main.go

$ dotenvx run -- go run main.go
Hello World
```

see [extended go guide](https://dotenvx.com/docs/quickstart)

</details>
<details><summary>Rust 🦀</summary><br>

```sh
$ echo "HELLO=World" > .env
$ echo 'fn main() {let hello = std::env::var("HELLO").unwrap_or("".to_string());println!("Hello {hello}");}' > src/main.rs

$ dotenvx run -- cargo run
Hello World
```

see [extended rust guide](https://dotenvx.com/docs/quickstart)

</details>
<details><summary>Java ☕️</summary><br>

```sh
$ echo "HELLO=World" > .env
$ echo 'public class Index { public static void main(String[] args) { System.out.println("Hello " + System.getenv("HELLO")); } }' > index.java

$ dotenvx run -- java index.java
Hello World
```

</details>
<details><summary>Clojure 🌿</summary><br>

```sh
$ echo "HELLO=World" > .env
$ echo '(println "Hello" (System/getenv "HELLO"))' > index.clj

$ dotenvx run -- clojure -M index.clj
Hello World
```

</details>
<details><summary>Kotlin 📐</summary><br>

```sh
$ echo "HELLO=World" > .env
$ echo 'fun main() { val hello = System.getenv("HELLO") ?: ""; println("Hello $hello") }' > index.kt
$ kotlinc index.kt -include-runtime -d index.jar

$ dotenvx run -- java -jar index.jar
Hello World
```

</details>
<details><summary>.NET 🔵</summary><br>

```sh
$ dotnet new console -n HelloWorld -o HelloWorld
$ cd HelloWorld
$ echo "HELLO=World" | Out-File -FilePath .env -Encoding utf8
$ echo 'Console.WriteLine($"Hello {Environment.GetEnvironmentVariable("HELLO")}");' > Program.cs

$ dotenvx run -- dotnet run
Hello World
```

</details>
<details><summary>Bash 🖥️</summary><br>

```sh
$ echo "HELLO=World" > .env

$ dotenvx run --quiet -- sh -c 'echo Hello $HELLO'
Hello World
```

</details>
<details><summary>Fish 🐠</summary><br>

```sh
$ echo "HELLO=World" > .env

$ dotenvx run --quiet -- sh -c 'echo Hello $HELLO'
Hello World
```

</details>
<details><summary>Cron ⏰</summary><br>

```sh
# run every day at 8am
0 8 * * * dotenvx run -- /path/to/myscript.sh
```

</details>
<details><summary>Frameworks ▲</summary><br>

```sh
$ dotenvx run -- next dev
$ dotenvx run -- npm start
$ dotenvx run -- bin/rails s
$ dotenvx run -- php artisan serve
```

see [framework guides](https://dotenvx.com/docs#frameworks)

</details>
<details><summary>Docker 🐳</summary><br>

```sh
$ docker run -it --rm -v $(pwd):/app dotenv/dotenvx run -- node index.js
```

Or in any image:

```Containerfile
FROM node:latest
RUN echo "HELLO=World" > .env && echo "console.log('Hello ' + process.env.HELLO)" > index.js
RUN curl -fsS https://dotenvx.sh/install.sh | sh
CMD ["/usr/local/bin/dotenvx", "run", "--", "echo", "Hello $HELLO"]
```

see [docker guide](https://dotenvx.com/docs/platforms/docker)

</details>
<details><summary>CI/CDs 🐙</summary><br>

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
    - run: curl -fsS https://dotenvx.sh/install.sh | sh
    - run: dotenvx run -- node build.js
      env:
        DOTENV_KEY: ${{ secrets.DOTENV_KEY }}
```

see [github actions guide](https://dotenvx.com/docs/cis/github-actions)

</details>
<details><summary>Platforms</summary><br>

```sh
# heroku
heroku buildpacks:add https://github.com/dotenvx/heroku-buildpack-dotenvx

# docker
RUN curl -fsS https://dotenvx.sh | sh

# vercel
npm install @dotenvx/dotenvx --save
```

see [platform guides](https://dotenvx.com/docs#platforms)

</details>
<details><summary>Process Managers</summary><br>

```js
// pm2
"scripts": {
  "start": "dotenvx run -- pm2-runtime start ecosystem.config.js --env production"
},
```

see [process manager guides](https://dotenvx.com/docs#process-managers)

</details>
<details><summary>npx</summary><br>

```sh
# alternatively use npx
$ npx @dotenvx/dotenvx run -- node index.js
$ npx @dotenvx/dotenvx run -- next dev
$ npx @dotenvx/dotenvx run -- npm start
```

</details>
<details><summary>npm</summary><br>

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

[dotenvx@1.X.X] injecting env (1) from .env.production
Hello World
```

</details>
<details><summary>asdf</summary><br>

```sh
# use dotenvx with asdf
$ asdf plugin add dotenvx
$ asdf install dotenvx latest
```

thank you [@jgburet](https://github.com/jgburet/asdf-dotenvx) of Paris 🇫🇷

</details>
<details><summary>Git</summary><br>

```sh
# use as a git submodule
$ git dotenvx run -- node index.js
$ git dotenvx run -- next dev
$ git dotenvx run -- npm start
```

</details>
<details><summary>Variable Expansion</summary><br>

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
<details><summary>Command Substitution</summary><br>

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
[dotenvx@1.X.X] injecting env (1) from .env.production
Hello production
> ^^
```

More examples

<details><summary>multiple `.env` files</summary><br>

```sh
$ echo "HELLO=local" > .env.local

$ echo "HELLO=World" > .env

$ dotenvx run -f .env.local -f .env -- node index.js
[dotenvx@1.X.X] injecting env (1) from .env.local,.env
Hello local
```

Note subsequent files do NOT override pre-existing variables defined in previous files or env. This follows historic principle. For example, above `local` wins – from the first file.

</details>

<details><summary>`--overload` flag</summary><br>

```sh
$ echo "HELLO=local" > .env.local

$ echo "HELLO=World" > .env

$ dotenvx run -f .env.local -f .env --overload -- node index.js
[dotenvx@1.X.X] injecting env (1) from .env.local,.env
Hello World
```

Note that with `--overload` subsequent files DO override pre-existing variables defined in previous files.
</details>
<details><summary>`--verbose` flag</summary><br>

```sh
$ echo "HELLO=production" > .env.production

$ dotenvx run -f .env.production --verbose -- node index.js
[dotenvx][verbose] injecting env from /path/to/.env.production
[dotenvx][verbose] HELLO set
[dotenvx@1.X.X] injecting env (1) from .env.production
Hello production
```

</details>
<details><summary>`--debug` flag</summary><br>

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
[dotenvx@1.X.X] injecting env (1) from .env.production
Hello production
```

</details>
<details><summary>`--quiet` flag</summary><br>

Use `--quiet` to suppress all output (except errors).

```sh
$ echo "HELLO=production" > .env.production

$ dotenvx run -f .env.production --quiet -- node index.js
Hello production
```

You can also set `DOTENV_CONFIG_QUIET=true`.

```sh
$ DOTENV_CONFIG_QUIET=true dotenvx run -f .env.production -- node index.js
Hello production
```

</details>
<details><summary>`--log-level` flag</summary><br>

Set `--log-level` to whatever you wish. For example, to suppress warnings (risky), set log level to `error`:

```sh
$ echo "HELLO=production" > .env.production

$ dotenvx run -f .env.production --log-level=error -- node index.js
Hello production
```

Available log levels are `error, warn, info, verbose, debug, silly`

</details>
<details><summary>`--convention` flag</summary><br>

Load envs using [Next.js' convention](https://nextjs.org/docs/pages/building-your-application/configuring/environment-variables#environment-variable-load-order) or [dotenv-flow convention](https://www.npmjs.com/package/dotenv-flow). Set `--convention` to `nextjs` or `flow`:

```sh
$ echo "HELLO=development local" > .env.development.local
$ echo "HELLO=local" > .env.local
$ echo "HELLO=development" > .env.development
$ echo "HELLO=env" > .env

$ dotenvx run --convention=nextjs -- node index.js
Hello development local

$ dotenvx run --convention=flow -- node index.js
Hello development local
```

(more conventions available upon request)

</details>

&nbsp;

## Encryption

> Add encryption to your `.env` files with a single command. Use `dotenvx encrypt`.

```sh
$ dotenvx encrypt
◈ encrypted (.env)
```

[![encrypted .env](https://github.com/user-attachments/assets/46dfe1a7-a027-4d80-9207-789eccc325dc)](https://dotenvx.com)

> A `DOTENV_PUBLIC_KEY` (encryption key) and a `DOTENV_PRIVATE_KEY` (decryption key) are generated using the same public-key cryptography as [Bitcoin](https://en.bitcoin.it/wiki/Secp256k1).

More examples

<details><summary>`.env`</summary><br>

```sh
$ echo "HELLO=World" > .env
$ dotenvx encrypt
$ echo "console.log('Hello ' + process.env.HELLO)" > index.js

$ dotenvx run -- node index.js
[dotenvx@1.X.X] injecting env (2) from .env
Hello World
```

</details>
<details><summary>`.env.production`</summary><br>

```sh
$ echo "HELLO=Production" > .env.production
$ dotenvx encrypt -f .env.production
$ echo "console.log('Hello ' + process.env.HELLO)" > index.js

$ DOTENV_PRIVATE_KEY_PRODUCTION="<.env.production private key>" dotenvx run -- node index.js
[dotenvx@1.X.X] injecting env (2) from .env.production
Hello Production
```

Note the `DOTENV_PRIVATE_KEY_PRODUCTION` ends with `_PRODUCTION`. This instructs `dotenvx run` to load the `.env.production` file.

</details>
<details><summary>`.env.ci`</summary><br>

```sh
$ echo "HELLO=Ci" > .env.ci
$ dotenvx encrypt -f .env.ci
$ echo "console.log('Hello ' + process.env.HELLO)" > index.js

$ DOTENV_PRIVATE_KEY_CI="<.env.ci private key>" dotenvx run -- node index.js
[dotenvx@1.X.X] injecting env (2) from .env.ci
Hello Ci
```

Note the `DOTENV_PRIVATE_KEY_CI` ends with `_CI`. This instructs `dotenvx run` to load the `.env.ci` file. See the pattern?

</details>
<details><summary>combine multiple encrypted .env files</summary><br>

```sh
$ dotenvx set HELLO World -f .env
$ dotenvx set HELLO Production -f .env.production
$ echo "console.log('Hello ' + process.env.HELLO)" > index.js

$ DOTENV_PRIVATE_KEY="<.env private key>" DOTENV_PRIVATE_KEY_PRODUCTION="<.env.production private key>" dotenvx run -- node index.js
[dotenvx@1.X.X] injecting env (3) from .env, .env.production
Hello World
```

Note the `DOTENV_PRIVATE_KEY` instructs `dotenvx run` to load the `.env` file and the `DOTENV_PRIVATE_KEY_PRODUCTION` instructs it to load the `.env.production` file. See the pattern?

</details>
<details><summary>use directories with monorepos</summary><br>

Point `-f` at a directory to load the `.env` inside it. From a workspace, this makes a shared root `.env` available without repeating its filename.

```text
my-monorepo/
  .env
  .env.keys
  apps/
    web/
      index.js
```

```sh
$ cd apps/web

$ dotenvx get HELLO -f ../..
World

$ dotenvx run -f ../.. -- node index.js
[dotenvx@1.X.X] injecting env (1) from ../../.env
Hello World
```

Encrypted values work without extra configuration when `.env.keys` sits beside the resolved `.env`.

The directory also becomes the base when using a convention:

```sh
$ dotenvx run -f ../.. --convention=nextjs -- node index.js
[dotenvx@1.X.X] injecting env (1) from ../../.env.development.local, ../../.env.local, ../../.env.development, ../../.env
Hello development local
```

If a workspace has its own `.env` but shares the root `.env.keys`, point `-fk` at the root directory:

```sh
$ dotenvx run -f . -fk ../.. -- node index.js
```

</details>
<details><summary>`--stdout`</summary><br>

```sh
$ echo "HELLO=World" > .env
$ dotenvx encrypt --stdout
$ dotenvx encrypt --stdout > .env.encrypted
```

</details>

<details><summary>other curves</summary><br>

> `secp256k1` is a well-known and battle tested curve, in use with Bitcoin and other cryptocurrencies, but we are open to adding support for more curves.
> 
> If your organization's compliance department requires [NIST approved curves](https://csrc.nist.gov/projects/elliptic-curve-cryptography) or other curves like `curve25519`, please reach out at [security@dotenvx.com](mailto:security@dotenvx.com).

</details>
&nbsp;

## Advanced

> Become a `dotenvx` power user.
>

### CLI 📟

Advanced CLI commands.

<details><summary>`run` - Variable Expansion</summary><br>

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
[dotenvx@1.X.X] injecting env (2) from .env
DATABASE_URL postgres://username@localhost/my_database
```

</details>
<details><summary>`run` - Default Values</summary><br>

Use default values when environment variables are unset or empty.

```ini
# .env
# Default value syntax: use value if set, otherwise use default
DATABASE_HOST=${DB_HOST:-localhost}
DATABASE_PORT=${DB_PORT:-5432}

# Alternative syntax (no colon): use value if set, otherwise use default
API_URL=${API_BASE_URL-https://api.example.com}
```
```js
// index.js
console.log('DATABASE_HOST', process.env.DATABASE_HOST)
console.log('DATABASE_PORT', process.env.DATABASE_PORT)
console.log('API_URL', process.env.API_URL)
```
```sh
$ dotenvx run --debug -- node index.js
[dotenvx@1.X.X] injecting env (3) from .env
DATABASE_HOST localhost
DATABASE_PORT 5432
API_URL https://api.example.com
```

</details>
<details><summary>`run` - Alternate Values</summary><br>

Use alternate values when environment variables are set and non-empty.

```ini
# .env
NODE_ENV=production

# Alternate value syntax: use alternate if set and non-empty, otherwise empty
DEBUG_MODE=${NODE_ENV:+false}
LOG_LEVEL=${NODE_ENV:+error}

# Alternative syntax (no colon): use alternate if set, otherwise empty  
CACHE_ENABLED=${NODE_ENV+true}
```
```js
// index.js
console.log('NODE_ENV', process.env.NODE_ENV)
console.log('DEBUG_MODE', process.env.DEBUG_MODE)
console.log('LOG_LEVEL', process.env.LOG_LEVEL)
console.log('CACHE_ENABLED', process.env.CACHE_ENABLED)
```
```sh
$ dotenvx run --debug -- node index.js
[dotenvx@1.X.X] injecting env (4) from .env
NODE_ENV production
DEBUG_MODE false
LOG_LEVEL error
CACHE_ENABLED true
```

</details>
<details><summary>`run` - Interpolation Syntax Summary (Variable Expansion, Default/Alternate Values)</summary><br>

Complete reference for variable interpolation patterns supported by dotenvx:

```ini
# .env
DEFINED_VAR=hello
EMPTY_VAR=
# UNDEFINED_VAR is not set

# Default value syntax - use variable if set/non-empty, otherwise use default
TEST1=${DEFINED_VAR:-fallback}     # Result: "hello"
TEST2=${EMPTY_VAR:-fallback}       # Result: "fallback"  
TEST3=${UNDEFINED_VAR:-fallback}   # Result: "fallback"

# Default value syntax (no colon) - use variable if set, otherwise use default
TEST4=${DEFINED_VAR-fallback}      # Result: "hello"
TEST5=${EMPTY_VAR-fallback}        # Result: "" (empty, but set)
TEST6=${UNDEFINED_VAR-fallback}    # Result: "fallback"

# Alternate value syntax - use alternate if variable is set/non-empty, otherwise empty
TEST7=${DEFINED_VAR:+alternate}    # Result: "alternate"
TEST8=${EMPTY_VAR:+alternate}      # Result: "" (empty)
TEST9=${UNDEFINED_VAR:+alternate}  # Result: "" (empty)

# Alternate value syntax (no colon) - use alternate if variable is set, otherwise empty  
TEST10=${DEFINED_VAR+alternate}    # Result: "alternate"
TEST11=${EMPTY_VAR+alternate}      # Result: "alternate" (empty but set)
TEST12=${UNDEFINED_VAR+alternate}  # Result: "" (empty)
```

**Key differences:**
- `:-` vs `-`: The colon makes empty values trigger the fallback
- `:+` vs `+`: The colon makes empty values not trigger the alternate  
- Default syntax (`-`): Use variable value or fallback
- Alternate syntax (`+`): Use alternate value or empty string

</details>
<details><summary>`run` - Command Substitution</summary><br>

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
[dotenvx@1.X.X] injecting env (1) from .env
DATABASE_URL postgres://yourusername@localhost/my_database
```

</details>
<details><summary>`run` - Shell Expansion</summary><br>

Prevent your shell from expanding inline `$VARIABLES` before dotenvx has a chance to inject it. Use a subshell.

```sh
$ dotenvx run --env="HELLO=World" -- sh -c 'echo Hello $HELLO'
Hello World
```

</details>
<details><summary>`run` - Multiline</summary><br>

Dotenvx supports multiline values. This is particularly useful in conjunction with Docker - which [does not support multiline values](https://stackoverflow.com/questions/50299617/set-multiline-environment-variable-with-dockerfile/79578348#79578348).

```ini
# .env
MULTILINE_PEM="-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAnNl1tL3QjKp3DZWM0T3u
LgGJQwu9WqyzHKZ6WIA5T+7zPjO1L8l3S8k8YzBrfH4mqWOD1GBI8Yjq2L1ac3Y/
bTdfHN8CmQr2iDJC0C6zY8YV93oZB3x0zC/LPbRYpF8f6OqX1lZj5vo2zJZy4fI/
kKcI5jHYc8VJq+KCuRZrvn+3V+KuL9tF9v8ZgjF2PZbU+LsCy5Yqg1M8f5Jp5f6V
u4QuUoobAgMBAAE=
-----END PUBLIC KEY-----"
```

```js
// index.js
console.log('MULTILINE_PEM', process.env.MULTILINE_PEM)
```

```sh
$ dotenvx run -- node index.js
MULTILINE_PEM -----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAnNl1tL3QjKp3DZWM0T3u
LgGJQwu9WqyzHKZ6WIA5T+7zPjO1L8l3S8k8YzBrfH4mqWOD1GBI8Yjq2L1ac3Y/
bTdfHN8CmQr2iDJC0C6zY8YV93oZB3x0zC/LPbRYpF8f6OqX1lZj5vo2zJZy4fI/
kKcI5jHYc8VJq+KCuRZrvn+3V+KuL9tF9v8ZgjF2PZbU+LsCy5Yqg1M8f5Jp5f6V
u4QuUoobAgMBAAE=
-----END PUBLIC KEY-----
```

</details>
<details><summary>`run` - Contextual Help</summary><br>

Unlike other dotenv libraries, dotenvx attempts to unblock you with contextual help.

For example, when missing a custom .env file:

```sh
$ dotenvx run -f .env.missing -- echo $HELLO
[MISSING_ENV_FILE] missing file (/Users/scottmotte/Code/dotenvx/playground/apr-16/.env.missing). fix: [echo "HELLO=World" > .env.missing]
```

or when missing a KEY:

```sh
$ echo "HELLO=World" > .env
$ dotenvx get GOODBYE
[MISSING_KEY] missing key (GOODBYE)
```

</details>
<details><summary>`run` - 1Password</summary><br>

Resolve [1Password op://](https://developer.1password.com/docs/cli/secrets-reference-syntax/) directly from your `.env` file.

```ini
# .env
API_KEY=op://Personal/my_api_key/password
```

Install the [1Password CLI](https://developer.1password.com/docs/cli/get-started/) and authenticate with `op`. Dotenvx automatically reads `op://` values through `op read` before injecting them.

```sh
$ dotenvx run -- node index.js
```

Use `--no-1password` to leave `op://` values unresolved.

```sh
$ dotenvx run --no-1password -- node index.js
```

The same flag is available for `dotenvx get` and `dotenvx validate`.

</details>
<details><summary>`run` - Bitwarden</summary><br>

Resolve `bw://` references directly from your `.env` file through the [Bitwarden Password Manager CLI](https://bitwarden.com/help/cli/).

```ini
# .env
API_KEY="bw://My GitHub Account/password"
```

The reference format is `bw://<item>/<field>`. The item can be a human-readable Bitwarden search term or an exact item UUID. Quote the dotenv value when the item name contains spaces.

Supported fields are:

- `username`
- `password`
- `uri`

When the vault is locked in an interactive terminal, dotenvx prompts for your Bitwarden master password.

Human-readable names are convenient, but must identify a single item. If multiple items match, Bitwarden returns an error. Use the item UUID when you need an unambiguous reference.

If Bitwarden cannot resolve a reference, dotenvx reports the error and leaves the original `bw://` value unresolved.

Use `--no-bitwarden` to skip Bitwarden resolution intentionally.

```sh
$ dotenvx run --no-bitwarden -- node index.js
```

The same flag is available for `dotenvx get` and `dotenvx validate`.

</details>
<details><summary>`run -f <directory>`</summary><br>

Run a command using the `.env` file in a directory. This is useful with monorepos.

```sh
$ dotenvx run -f ../.. -- node index.js
[dotenvx@1.X.X] injecting env (1) from ../../.env
Hello World
```

</details>
<details><summary>`run` - multiple `-f` flags</summary><br>

Compose multiple `.env` files for environment variables loading, as you need.

```sh
$ echo "HELLO=local" > .env.local
$ echo "HELLO=World" > .env
$ echo "console.log('Hello ' + process.env.HELLO)" > index.js

$ dotenvx run -f .env.local -f .env -- node index.js
[dotenvx@1.X.X] injecting env (1) from .env.local, .env
Hello local
```

Note subsequent files do NOT override pre-existing variables defined in previous files or env. This follows historic principle. For example, above `local` wins – from the first file.

</details>
<details><summary>`run --env HELLO=String`</summary><br>

Set environment variables as a simple `KEY=value` string pair.

```sh
$ echo "HELLO=World" > .env
$ echo "console.log('Hello ' + process.env.HELLO)" > index.js

$ dotenvx run --env HELLO=String -f .env -- node index.js
[dotenvx@1.X.X] injecting env (1) from .env, and --env flag
Hello String
```

</details>
<details><summary>`run --redact`</summary><br>

Run any command with real environment variables while automatically redacting their values from stdout and stderr. Keys ending in `_PLAIN` are left visible.

```sh
$ echo "SECRET=super-secret-value" > .env
$ echo "VISIBLE_PLAIN=visible-value" >> .env
$ echo "console.log(process.env.SECRET, process.env.VISIBLE_PLAIN)" > index.js

$ dotenvx run --redact --quiet -- node index.js
[REDACTED] visible-value
```

Redaction is off by default. It applies to every key declared in `.env` files and `--env` flags unless the key ends in `_PLAIN`. If an existing environment variable takes precedence, its effective value is redacted too. Matching is exact, so transformed or derived values are not redacted.

When stdin, stdout, and stderr are attached to a terminal, dotenvx preserves interactive behavior on macOS and Linux systems with `script` available. Piped and redirected commands continue to use normal stdin, stdout, and stderr streams.

</details>
<details><summary>`run --redact -- claude -p`</summary><br>

Run Claude in print mode with real environment variables while redacting any values it prints.

```sh
$ echo "SECRET=super-secret-value" > .env

$ dotenvx run --redact --quiet -- claude -p 'Print the value of $SECRET'
[REDACTED]
```

</details>
<details><summary>`run --redact -- claude`</summary><br>

Start a fully interactive Claude session. Claude receives the real values, but any values it prints are redacted.

```sh
$ echo "SECRET=super-secret-value" > .env

$ dotenvx run --redact --quiet -- claude
```

</details>
<details><summary>`run --redact -- codex exec`</summary><br>

Run Codex non-interactively with real environment variables while redacting any values it prints.

```sh
$ echo "SECRET=super-secret-value" > .env

$ dotenvx run --redact --quiet -- codex exec 'Print the value of $SECRET'
[REDACTED]
```

</details>
<details><summary>`run --redact -- codex`</summary><br>

Start a fully interactive Codex session. Codex receives the real values, but any values it prints are redacted.

```sh
$ echo "SECRET=super-secret-value" > .env

$ dotenvx run --redact --quiet -- codex
```

</details>
<details><summary>`run --overload`</summary><br>

Override existing env variables. These can be variables already on your machine or variables loaded as files consecutively. The last variable seen will 'win'.

```sh
$ echo "HELLO=local" > .env.local
$ echo "HELLO=World" > .env
$ echo "console.log('Hello ' + process.env.HELLO)" > index.js

$ dotenvx run -f .env.local -f .env --overload -- node index.js
[dotenvx@1.X.X] injecting env (1) from .env.local, .env
Hello World
```

Note that with `--overload` subsequent files DO override pre-existing variables defined in previous files.

</details>
<details><summary>`run` - Environment Variable Precedence (Container/Cloud Deployments)</summary><br>

When deploying applications in containers or cloud environments, you often need to override specific environment variables at runtime without modifying committed `.env` files. By default, dotenvx follows the historic dotenv principle: **environment variables already present take precedence over `.env` files**.

```sh
# .env.prod contains: MODEL_REGISTRY=registry.company.com/models/v1
$ echo "MODEL_REGISTRY=registry.company.com/models/v1" > .env.prod
$ echo "console.log('MODEL_REGISTRY:', process.env.MODEL_REGISTRY)" > app.js

# Without environment variable set - uses .env.prod value
$ dotenvx run -f .env.prod -- node app.js
MODEL_REGISTRY: registry.company.com/models/v1

# With environment variable set (e.g., via Azure Container Service) - environment variable takes precedence
$ MODEL_REGISTRY=registry.azure.com/models/v2 dotenvx run -f .env.prod -- node app.js
MODEL_REGISTRY: registry.azure.com/models/v2

# To force .env.prod to override environment variables, use --overload
$ MODEL_REGISTRY=registry.azure.com/models/v2 dotenvx run -f .env.prod --overload -- node app.js
MODEL_REGISTRY: registry.company.com/models/v1
```

**For container deployments:** Set environment variables through your cloud provider's UI/configuration (Azure Container Service, AWS ECS, etc.) to override specific values from committed `.env` files without rebuilding your application.

</details>
<details><summary>`DOTENV_PRIVATE_KEY=key run`</summary><br>

Decrypt your encrypted `.env` by setting `DOTENV_PRIVATE_KEY` before `dotenvx run`.

```sh
$ touch .env
$ dotenvx set HELLO encrypted
$ echo "console.log('Hello ' + process.env.HELLO)" > index.js

# check your .env.keys files for your privateKey
$ DOTENV_PRIVATE_KEY="122...0b8" dotenvx run -- node index.js
[dotenvx@1.X.X] injecting env (2) from .env
Hello encrypted
```

</details>
<details><summary>`DOTENV_PRIVATE_KEY_PRODUCTION=key run`</summary><br>

Decrypt your encrypted `.env.production` by setting `DOTENV_PRIVATE_KEY_PRODUCTION` before `dotenvx run`. Alternatively, this can be already set on your server or cloud provider.

```sh
$ touch .env.production
$ dotenvx set HELLO "production encrypted" -f .env.production
$ echo "console.log('Hello ' + process.env.HELLO)" > index.js

# check .env.keys for your privateKey
$ DOTENV_PRIVATE_KEY_PRODUCTION="122...0b8" dotenvx run -- node index.js
[dotenvx@1.X.X] injecting env (2) from .env.production
Hello production encrypted
```

Note the `DOTENV_PRIVATE_KEY_PRODUCTION` ends with `_PRODUCTION`. This instructs dotenvx run to load the `.env.production` file.

</details>
<details><summary>`DOTENV_PRIVATE_KEY_CI=key dotenvx run`</summary><br>

Decrypt your encrypted `.env.ci` by setting `DOTENV_PRIVATE_KEY_CI` before `dotenvx run`. Alternatively, this can be already set on your server or cloud provider.

```sh
$ touch .env.ci
$ dotenvx set HELLO "ci encrypted" -f .env.ci
$ echo "console.log('Hello ' + process.env.HELLO)" > index.js

# check .env.keys for your privateKey
$ DOTENV_PRIVATE_KEY_CI="122...0b8" dotenvx run -- node index.js
[dotenvx@1.X.X] injecting env (2) from .env.ci
Hello ci encrypted
```

Note the `DOTENV_PRIVATE_KEY_CI` ends with `_CI`. This instructs dotenvx run to load the `.env.ci` file. See the pattern?

</details>
<details><summary>`DOTENV_PRIVATE_KEY=key DOTENV_PRIVATE_KEY_PRODUCTION=key run` - Combine Multiple</summary><br>

Decrypt your encrypted `.env` and `.env.production` files by setting `DOTENV_PRIVATE_KEY` and `DOTENV_PRIVATE_KEY_PRODUCTION` before `dotenvx run`. 

```sh
$ touch .env
$ touch .env.production
$ dotenvx set HELLO encrypted
$ dotenvx set HELLO "production encrypted" -f .env.production
$ echo "console.log('Hello ' + process.env.HELLO)" > index.js

# check .env.keys for your privateKeys
$ DOTENV_PRIVATE_KEY="122...0b8" DOTENV_PRIVATE_KEY_PRODUCTION="122...0b8" dotenvx run -- node index.js
[dotenvx@1.X.X] injecting env (3) from .env, .env.production
Hello encrypted

$ DOTENV_PRIVATE_KEY_PRODUCTION="122...0b8" DOTENV_PRIVATE_KEY="122...0b8" dotenvx run -- node index.js
[dotenvx@1.X.X] injecting env (3) from .env.production, .env
Hello production encrypted
```

Compose any encrypted files you want this way. As long as a `DOTENV_PRIVATE_KEY_${environment}` is set, the values from `.env.${environment}` will be decrypted at runtime.

</details>
<details><summary>`run --verbose`</summary><br>

Set log level to `verbose`. ([log levels](https://docs.npmjs.com/cli/v8/using-npm/logging#setting-log-levels))

```sh
$ echo "HELLO=production" > .env.production
$ echo "console.log('Hello ' + process.env.HELLO)" > index.js

$ dotenvx run -f .env.production --verbose -- node index.js
loading env from .env.production (/path/to/.env.production)
HELLO set
[dotenvx@1.X.X] injecting env (1) from .env.production
Hello production
```

</details>
<details><summary>`run --debug`</summary><br>

Set log level to `debug`. ([log levels](https://docs.npmjs.com/cli/v8/using-npm/logging#setting-log-levels))

```sh
$ echo "HELLO=production" > .env.production
$ echo "console.log('Hello ' + process.env.HELLO)" > index.js

$ dotenvx run -f .env.production --debug -- node index.js
process command [node index.js]
options: {"env":[],"envFile":[".env.production"]}
loading env from .env.production (/path/to/.env.production)
{"HELLO":"production"}
HELLO set
HELLO set to production
[dotenvx@1.X.X] injecting env (1) from .env.production
executing process command [node index.js]
expanding process command to [/opt/homebrew/bin/node index.js]
Hello production
```

</details>
<details><summary>`run --quiet`</summary><br>

Use `--quiet` to suppress all output (except errors). ([log levels](https://docs.npmjs.com/cli/v8/using-npm/logging#setting-log-levels))

```sh
$ echo "HELLO=production" > .env.production
$ echo "console.log('Hello ' + process.env.HELLO)" > index.js

$ dotenvx run -f .env.production --quiet -- node index.js
Hello production
```

You can also set `DOTENV_CONFIG_QUIET=true`.

```sh
$ DOTENV_CONFIG_QUIET=true dotenvx run -f .env.production -- node index.js
Hello production
```

</details>
<details><summary>`run --log-level`</summary><br>

Set `--log-level` to whatever you wish. For example, to suppress warnings (risky), set log level to `error`:

```sh
$ echo "HELLO=production" > .env.production
$ echo "console.log('Hello ' + process.env.HELLO)" > index.js

$ dotenvx run -f .env.production --log-level=error -- node index.js
Hello production
```

Available log levels are `error, warn, info, verbose, debug, silly` ([source](https://docs.npmjs.com/cli/v8/using-npm/logging#setting-log-levels))

</details>
<details><summary>`run --validate`</summary><br>

Validate your environment against `.env.example`.

```ini
# .env.example
DATABASE_URL=
API_KEY=
SENTRY_DSN= # optional
```

```sh
$ dotenvx run --validate -- node index.js
[VALIDATION_FAILED] missing required (DATABASE_URL, API_KEY). fix: [https://github.com/dotenvx/dotenvx/issues/907]
```

Validation errors are reported without stopping your command. Combine `--validate` with `--strict` to exit with code `1` before the command runs.

```sh
$ dotenvx run --validate --strict -- node index.js
```

Any inline comment containing the word `optional` marks that key as optional. If `.env.example` is missing, dotenvx reports `MISSING_ENV_EXAMPLE`. An empty `.env.example` is valid and declares no required variables.

</details>
<details><summary>`run --strict`</summary><br>

Exit with code `1` if any errors are encountered - like a missing .env file or decryption failure.

```sh
$ echo "console.log('Hello ' + process.env.HELLO)" > index.js

$ dotenvx run -f .env.missing --strict -- node index.js
[MISSING_ENV_FILE] missing file (/path/to/.env.missing). fix: [echo "HELLO=World" > .env.missing]
```

This can be useful in `ci` scripts where you want to fail the ci if your `.env` file could not be decrypted at runtime.

</details>
<details><summary>`run --ignore`</summary><br>

Ignore errors like `MISSING_ENV_FILE`.

```sh
$ echo "console.log('Hello ' + process.env.HELLO)" > index.js

$ dotenvx run -f .env.missing --ignore=MISSING_ENV_FILE -- node index.js
...
```

You can also set `DOTENV_CONFIG_IGNORE="MISSING_ENV_FILE"`. It is parsed as a comma-separated list.

```sh
$ DOTENV_CONFIG_IGNORE="MISSING_ENV_FILE,OTHER_ERROR_CODE" dotenvx run -f .env.missing -- node index.js
```
</details>
<details><summary>`run --convention=nextjs`</summary><br>

Load envs using [Next.js' convention](https://nextjs.org/docs/pages/building-your-application/configuring/environment-variables#environment-variable-load-order). Set `--convention` to `nextjs`:

```sh
$ echo "HELLO=development local" > .env.development.local
$ echo "HELLO=local" > .env.local
$ echo "HELLO=development" > .env.development
$ echo "HELLO=env" > .env
$ echo "console.log('Hello ' + process.env.HELLO)" > index.js

$ dotenvx run --convention=nextjs -- node index.js
[dotenvx@1.X.X] injecting env (1) from .env.development.local, .env.local, .env.development, .env
Hello development local
```

You can also set `DOTENV_CONFIG_CONVENTION=nextjs`.

```sh
$ DOTENV_CONFIG_CONVENTION=nextjs dotenvx run -- node index.js
[dotenvx@1.X.X] injecting env (1) from .env.development.local, .env.local, .env.development, .env
Hello development local
```

(more conventions available upon request)

</details>
<details><summary>`run -f <directory> --convention=nextjs`</summary><br>

Run a command using Next.js' convention from a directory. This is useful with monorepos.

```sh
$ dotenvx run -f ../.. --convention=nextjs -- node index.js
[dotenvx@1.X.X] injecting env (1) from ../../.env.development.local, ../../.env.local, ../../.env.development, ../../.env
Hello development local
```

</details>
<details><summary>`run --convention=flow`</summary><br>

Load envs using [dotenv-flow's convention](https://www.npmjs.com/package/dotenv-flow). Set `--convention` to `flow`:

```sh
$ echo "HELLO=development local" > .env.development.local
$ echo "HELLO=development" > .env.development
$ echo "HELLO=local" > .env.local
$ echo "HELLO=env" > .env
$ echo "console.log('Hello ' + process.env.HELLO)" > index.js

$ NODE_ENV=development dotenvx run --convention=flow -- node index.js 
[dotenvx@1.X.X] injecting env (1) from .env.development.local, .env.development, .env.local, .env
Hello development local
```

You can also set `DOTENV_CONFIG_CONVENTION=flow`.

```sh
$ NODE_ENV=development DOTENV_CONFIG_CONVENTION=flow dotenvx run -- node index.js
[dotenvx@1.X.X] injecting env (1) from .env.development.local, .env.development, .env.local, .env
Hello development local
```

Further, we recommend using `DOTENV_ENV` over `NODE_ENV`– as `dotenvx` works everywhere, not just node.

```sh
$ DOTENV_ENV=development dotenvx run --convention=flow -- node index.js 
[dotenvx@1.X.X] injecting env (1) from .env.development.local, .env.development, .env.local, .env
Hello development local
```

</details>
<details><summary>`run -fk`</summary><br>

Specify path to `.env.keys`. This is useful with monorepos.

```sh
$ mkdir -p apps/app1
$ touch apps/app1/.env
$ dotenvx set HELLO World -fk .env.keys -f apps/app1/.env

$ dotenvx run -fk .env.keys -f apps/app1/.env -- yourcommand
```

</details>
<details><summary>`run --mask`</summary><br>

Inject masked values into the command. By default, up to the first six characters are visible.

```sh
$ echo "SECRET=abcdefghijkl" > .env
$ echo "console.log(process.env.SECRET)" > index.js

$ dotenvx run --mask --quiet -- node index.js
abcdef******
```

Pass a number to control how many characters are visible, such as `--mask 0` to fully mask values.

</details>
<details><summary>`run --token`</summary><br>

Set Armor ⛨ token for retrieving armored private keys.

```sh
$ dotenvx run --token "$DOTENVX_ARMOR_TOKEN" -- yourcommand
```

</details>
<details><summary>`run --no-native`</summary><br>

Turn off OS secret store lookups.

```sh
$ dotenvx run --no-native -- yourcommand
```

</details>
<details><summary>`run --no-armor`</summary><br>

Turn off [Dotenvx Armor ⛨](https://dotenvx.com/armor) features.

```sh
$ dotenvx run --no-armor -- yourcommand
```

</details>
<details><summary>`get KEY`</summary><br>

Return a single environment variable's value.

```sh
$ echo "HELLO=World" > .env

$ dotenvx get HELLO
World
```

</details>
<details><summary>`get KEY --mask`</summary><br>

Return a masked environment variable value. By default, up to the first six characters are visible.

```sh
$ echo "SECRET=abcdefghijkl" > .env

$ dotenvx get SECRET --mask
abcdef******
```

Pass a number to control how many characters are visible, such as `--mask 0` to fully mask values.

</details>
<details><summary>`get KEY --no-native`</summary><br>

Turn off OS secret store lookups for get.

```sh
$ dotenvx get HELLO --no-native
```

</details>
<details><summary>`get KEY --no-armor`</summary><br>

Turn off [Dotenvx Armor ⛨](https://dotenvx.com/armor) features for get.

```sh
$ dotenvx get HELLO --no-armor
World
```

</details>
<details><summary>`get KEY --ignore`</summary><br>

Ignore specific error codes.

```sh
$ dotenvx get HELLO --ignore=MISSING_ENV_FILE
```

Ignore multiple error codes by separating them with spaces.

```sh
$ dotenvx get HELLO --ignore=MISSING_ENV_FILE MISSING_KEY
```

You can also set `DOTENV_CONFIG_IGNORE`. Its value is a comma-separated list.

```sh
$ DOTENV_CONFIG_IGNORE=MISSING_ENV_FILE,OTHER dotenvx get HELLO
```

</details>
<details><summary>`get KEY -f`</summary><br>

Return a single environment variable's value from a specific `.env` file.

```sh
$ echo "HELLO=World" > .env
$ echo "HELLO=production" > .env.production

$ dotenvx get HELLO -f .env.production
production
```

</details>
<details><summary>`get KEY -f <directory>`</summary><br>

Return a single environment variable's value from the `.env` file in a directory. This is useful with monorepos.

```sh
$ dotenvx get HELLO -f ../..
World
```

</details>
<details><summary>`get KEY -fk`</summary><br>

Specify path to `.env.keys`. This is useful with monorepos.

```sh
$ mkdir -p apps/app1
$ touch apps/app1/.env
$ dotenvx set HELLO World -fk .env.keys -f apps/app1/.env

$ dotenvx get HELLO -fk .env.keys -f apps/app1/.env
world
```

</details>
<details><summary>`get KEY --env`</summary><br>

Return a single environment variable's value from a `--env` string.

```sh
$ dotenvx get HELLO --env HELLO=String -f .env.production
String
```

</details>

<details><summary>`get KEY --overload`</summary><br>

Return a single environment variable's value where each found value is overloaded.

```sh
$ echo "HELLO=World" > .env
$ echo "HELLO=production" > .env.production

$ dotenvx get HELLO -f .env.production --env HELLO=String -f .env --overload
World
```

</details>
<details><summary>`get KEY --strict`</summary><br>

Exit with code `1` if any errors are encountered - like a missing key, missing .env file, or decryption failure.

```sh
$ dotenvx get DOES_NOT_EXIST --strict
[MISSING_KEY] missing key (DOES_NOT_EXIST)
```

</details>
<details><summary>`get KEY --convention=nextjs`</summary><br>

Return a single environment variable's value using [Next.js' convention](https://nextjs.org/docs/pages/building-your-application/configuring/environment-variables#environment-variable-load-order). Set `--convention` to `nextjs`:

```sh
$ echo "HELLO=development local" > .env.development.local
$ echo "HELLO=local" > .env.local
$ echo "HELLO=development" > .env.development
$ echo "HELLO=env" > .env
$ echo "console.log('Hello ' + process.env.HELLO)" > index.js

$ dotenvx get HELLO --convention=nextjs
development local
```

You can also set `DOTENV_CONFIG_CONVENTION=nextjs`.

```sh
$ DOTENV_CONFIG_CONVENTION=nextjs dotenvx get HELLO
development local
```

</details>
<details><summary>`get KEY -f <directory> --convention=nextjs`</summary><br>

Return a single environment variable's value using Next.js' convention from a directory. This is useful with monorepos.

```sh
$ dotenvx get HELLO -f ../.. --convention=nextjs
development local
```

</details>
<details><summary>`get KEY --convention=flow`</summary><br>

Return a single environment variable's value using [dotenv-flow's convention](https://www.npmjs.com/package/dotenv-flow). Set `--convention` to `flow`:

```sh
$ echo "HELLO=development local" > .env.development.local
$ echo "HELLO=development" > .env.development
$ echo "HELLO=local" > .env.local
$ echo "HELLO=env" > .env
$ echo "console.log('Hello ' + process.env.HELLO)" > index.js

$ NODE_ENV=development dotenvx get HELLO --convention=flow
development local
```

You can also set `DOTENV_CONFIG_CONVENTION=flow`.

```sh
$ NODE_ENV=development DOTENV_CONFIG_CONVENTION=flow dotenvx get HELLO
development local
```

Further, we recommend using `DOTENV_ENV` over `NODE_ENV`– as `dotenvx` works everywhere, not just node.

```sh
$ DOTENV_ENV=development dotenvx get HELLO --convention=flow
development local
```

</details>
<details><summary>`get` (json)</summary><br>

Return a json response of all key/value pairs in a `.env` file.

```sh
$ echo "HELLO=World" > .env

$ dotenvx get
{"HELLO":"World"}
```

</details>
<details><summary>`get --pretty-print`</summary><br>

Make the JSON output more readable.

```sh
$ echo "HELLO=World" > .env

$ dotenvx get --pretty-print
{
  "HELLO": "World"
}
```

</details>
<details><summary>`get -ik`</summary><br>

Include only matching keys by passing `--include-key`. Glob patterns are supported.

```sh
$ echo "HELLO=World\nHOLA=Mundo\nGOODBYE=World" > .env

$ dotenvx get -ik "H*"
{"HELLO":"World","HOLA":"Mundo"}
```

</details>
<details><summary>`get -ek`</summary><br>

Exclude matching keys by passing `--exclude-key`. Glob patterns are supported.

```sh
$ echo "DOTENV_PUBLIC_KEY=public\nHELLO=World" > .env

$ dotenvx get --format=eval-export -ek "DOTENV_PUBLIC_KEY*"
export HELLO='World'
```

</details>
<details><summary>`get --format colon`</summary><br>

Return a colon-formatted response of all key/value pairs in a `.env` file.

```sh
$ echo "HELLO=World" > .env

$ dotenvx get --format colon
HELLO: World
```

</details>
<details><summary>`get --format shell`</summary><br>

Return a shell formatted response of all key/value pairs in a `.env` file.

```sh
$ echo "HELLO=World" > .env
$ echo "KEY=value" >> .env

$ dotenvx get --format shell
HELLO=World KEY=value
```

This can be useful when combined with `env` on the command line.

```
$ echo "console.log('Hello ' + process.env.KEY + ' ' + process.env.HELLO)" > index.js
$ env $(dotenvx get --format=shell) node index.js
Hello value World
```

or with `export`.

```
$ echo "console.log('Hello ' + process.env.KEY + ' ' + process.env.HELLO)" > index.js
$ export $(dotenvx get --format=shell)
$ node index.js
Hello value World
```

</details>
<details><summary>`get --format eval`</summary><br>

Return an `eval`-ready shell formatted response of all key/value pairs in a `.env` file.

```sh
$ echo "HELLO=World" > .env
$ echo "KEY=value" >> .env

$ dotenvx get --format eval
HELLO="World"
KEY="value"
```

Note that this exports newlines and quoted strings.

This can be useful for more complex .env values (spaces, escaped characters, quotes, etc) combined with `eval` on the command line.

```sh
$ echo "console.log('Hello ' + process.env.KEY + ' ' + process.env.HELLO)" > index.js
$ eval $(dotenvx get --format=eval) node index.js
Hello value World
```

Be careful with `eval` as it allows for arbitrary execution of commands. Prefer `dotenvx run --` but in some cases `eval` is a sharp knife that is useful to have.

</details>

<details><summary>`get --all`</summary><br>

Return preset machine envs as well.

```sh
$ echo "HELLO=World" > .env

$ dotenvx get --all
{"PWD":"/some/file/path","USER":"username","LIBRARY_PATH":"/usr/local/lib", ..., "HELLO":"World"}
```

</details>
<details><summary>`get --all --pretty-print`</summary><br>

Make the output more readable - pretty print it.

```sh
$ echo "HELLO=World" > .env

$ dotenvx get --all --pretty-print
{
  "PWD": "/some/filepath",
  "USER": "username",
  "LIBRARY_PATH": "/usr/local/lib",
  ...,
  "HELLO": "World"
}
```

</details>
<details><summary>`set KEY value`</summary><br>

Set an encrypted key/value (on by default).

```sh
$ touch .env

$ dotenvx set HELLO World
set HELLO with encryption (.env)
```

</details>
<details><summary>`set KEY value -f`</summary><br>

Set an (encrypted) key/value for another `.env` file.

```sh
$ touch .env.production

$ dotenvx set HELLO production -f .env.production
set HELLO with encryption (.env.production)
```

</details>
<details><summary>`set KEY value -fk`</summary><br>

Specify path to `.env.keys`. This is useful with monorepos.

```sh
$ mkdir -p apps/app1
$ touch apps/app1/.env

$ dotenvx set HELLO World -fk .env.keys -f apps/app1/.env
set HELLO with encryption (.env)
```

Put it to use.

```sh
$ dotenvx get -fk .env.keys -f apps/app1/.env
```

Use it with a relative path.

```sh
$ cd apps/app1
$ dotenvx get -fk ../../.env.keys -f .env
```

</details>
<details><summary>`set KEY "value with spaces"`</summary><br>

Set a value containing spaces.

```sh
$ touch .env.ci

$ dotenvx set HELLO "my ci" -f .env.ci
set HELLO with encryption (.env.ci)
```

</details>
<details><summary>`set KEY -- "- + * ÷"`</summary><br>

If your value starts with a dash (`-`), then place two dashes instructing the cli that there are no more flag arguments.

```sh
$ touch .env.ci

$ dotenvx set HELLO -f .env.ci -- "- + * ÷"
set HELLO with encryption (.env.ci)
```

</details>
<details><summary>`set KEY value --plain`</summary><br>

Set a plaintext key/value.

```sh
$ touch .env

$ dotenvx set HELLO World --plain
set HELLO (.env)
```

</details>
<details><summary>`set KEY_PLAIN value`</summary><br>

Set a plaintext key/value inside an encrypted `.env` file by ending the key with `_PLAIN`.

```sh
$ touch .env

$ dotenvx set HELLO_PLAIN World
set HELLO_PLAIN (.env)
```

Keys ending in `_PLAIN` are not encrypted by `dotenvx set` or `dotenvx encrypt`.

</details>
<details><summary>`set KEY value --no-native`</summary><br>

Turn off OS secret store lookups for set.

```sh
$ dotenvx set HELLO World --no-native
```

</details>
<details><summary>`set KEY value --no-armor`</summary><br>

Turn off [Dotenvx Armor ⛨](https://dotenvx.com/armor) features for set.

```sh
$ dotenvx set HELLO World --no-armor
◈ encrypted HELLO (.env)
```

</details>
<details><summary>`set KEY value --no-create`</summary><br>

Do not create a missing `.env` file.

```sh
$ dotenvx set HELLO World -f .env.production --no-create
```

</details>
<details><summary>`encrypt`</summary><br>

Encrypt the contents of a `.env` file to an encrypted `.env` file.

```sh
$ echo "HELLO=World" > .env

$ dotenvx encrypt
◈ encrypted (.env) + local key (.env.keys)
⮕  next run [dotenvx gitignore --pattern .env.keys] to gitignore .env.keys
⮕  next run [DOTENV_PRIVATE_KEY='122...0b8' dotenvx run -- yourcommand] to test decryption locally
```

</details>
<details><summary>`encrypt -f`</summary><br>

Encrypt the contents of a specified `.env` file to an encrypted `.env` file.

```sh
$ echo "HELLO=World" > .env
$ echo "HELLO=Production" > .env.production

$ dotenvx encrypt -f .env.production
◈ encrypted (.env.production) + local key (.env.keys)
⮕  next run [dotenvx gitignore --pattern .env.keys] to gitignore .env.keys
⮕  next run [DOTENV_PRIVATE_KEY='bff...bc4' dotenvx run -- yourcommand] to test decryption locally
```

</details>
<details><summary>`encrypt --no-native`</summary><br>

Turn off OS secret store lookups for encrypt.

```sh
$ dotenvx encrypt --no-native
◈ encrypted (.env)
```

</details>
<details><summary>`encrypt --no-armor`</summary><br>

Turn off [Dotenvx Armor ⛨](https://dotenvx.com/armor) features for encrypt.

```sh
$ dotenvx encrypt --no-armor
◈ encrypted (.env)
```

</details>
<details><summary>`encrypt --token`</summary><br>

Set the Armor token.

```sh
$ dotenvx encrypt --token token
◈ encrypted (.env) · armored ⛨
```

</details>
<details><summary>`encrypt --no-create`</summary><br>

Do not create a missing `.env` file.

```sh
$ dotenvx encrypt -f .env.production --no-create
```

</details>
<details><summary>`encrypt -fk`</summary><br>

Specify path to `.env.keys`. This is useful with monorepos.

```sh
$ mkdir -p apps/app1
$ echo "HELLO=World" > apps/app1/.env

$ dotenvx encrypt -fk .env.keys -f apps/app1/.env
◈ encrypted (apps/app1/.env)
```

Put it to use.

```sh
$ dotenvx run -fk .env.keys -f apps/app1/.env
```

Use with a relative path.

```sh
$ cd apps/app1
$ dotenvx run -fk ../../.env.keys -f .env
```

</details>
<details><summary>`encrypt -k`</summary><br>

Specify the key(s) to encrypt by passing `--key`.

```sh
$ echo "HELLO=World\nHELLO2=Universe" > .env

$ dotenvx encrypt -k HELLO2
◈ encrypted (.env)
```

Even specify a glob pattern.

```sh
$ echo "HELLO=World\nHOLA=Mundo" > .env

$ dotenvx encrypt -k "HE*"
◈ encrypted (.env)
```

</details>
<details><summary>`encrypt -ek`</summary><br>

Specify the key(s) to NOT encrypt by passing `--exclude-key`.

```sh
$ echo "HELLO=World\nHELLO2=Universe" > .env

$ dotenvx encrypt -ek HELLO
◈ encrypted (.env)
```

Even specify a glob pattern.

```sh
$ echo "HELLO=World\nHOLA=Mundo" > .env

$ dotenvx encrypt -ek "HO*"
◈ encrypted (.env)
```

</details>
<details><summary>`encrypt KEY_PLAIN`</summary><br>

Skip encryption for keys ending in `_PLAIN`.

```sh
$ echo "HELLO=World\nHELLO_PLAIN=visible" > .env

$ dotenvx encrypt
◈ encrypted (.env)
```

`HELLO` is encrypted. `HELLO_PLAIN` stays plaintext.

</details>
<details><summary>`encrypt --stdout`</summary><br>

Encrypt the contents of a `.env` file and send to stdout.

```sh
$ echo "HELLO=World" > .env
$ dotenvx encrypt --stdout
#/-------------------[DOTENV_PUBLIC_KEY]--------------------/
#/            public-key encryption for .env files          /
#/       [how it works](https://dotenvx.com/encryption)     /
#/----------------------------------------------------------/
DOTENV_PUBLIC_KEY="034af93e93708b994c10f236c96ef88e47291066946cce2e8d98c9e02c741ced45"
# .env
HELLO="encrypted:BDqDBibm4wsYqMpCjTQ6BsDHmMadg9K3dAt+Z9HPMfLEIRVz50hmLXPXRuDBXaJi/LwWYEVUNiq0HISrslzQPaoyS8Lotg3gFWJTsNCdOWnqpjF2xNUX2RQiP05kAbEXM6MWVjDr"
```

or send to a file:

```sh
$ echo "HELLO=World" > .env
$ dotenvx encrypt --stdout > somefile.txt
```

</details>
<details><summary>`decrypt`</summary><br>

Decrypt the contents of an encrypted `.env` file to an unencrypted `.env` file.

```sh
$ echo "HELLO=World" > .env
$ dotenvx encrypt
◈ encrypted (.env)
$ dotenvx decrypt
◇ decrypted (.env)
```

</details>
<details><summary>`decrypt --no-native`</summary><br>

Turn off OS secret store lookups for decrypt.

```sh
$ dotenvx decrypt --no-native
◇ decrypted (.env)
```

</details>
<details><summary>`decrypt --no-armor`</summary><br>

Turn off [Dotenvx Armor ⛨](https://dotenvx.com/armor) features for decrypt.

```sh
$ dotenvx decrypt --no-armor
◇ decrypted (.env)
```

</details>
<details><summary>`decrypt -f`</summary><br>

Decrypt the contents of a specified encrypted `.env` file to an unencrypted `.env` file.

```sh
$ echo "HELLO=World" > .env
$ echo "HELLO=Production" > .env.production

$ dotenvx encrypt -f .env.production
◈ encrypted (.env.production)
$ dotenvx decrypt -f .env.production
◇ decrypted (.env.production)
```

</details>
<details><summary>`decrypt -fk`</summary><br>

Specify path to `.env.keys`. This is useful with monorepos.

```sh
$ mkdir -p apps/app1
$ echo "HELLO=World" > apps/app1/.env

$ dotenvx encrypt -fk .env.keys -f apps/app1/.env
◈ encrypted (apps/app1/.env)
$ dotenvx decrypt -fk .env.keys -f apps/app1/.env
◇ decrypted (apps/app1/.env)
```

</details>
<details><summary>`decrypt -k`</summary><br>

Decrypt the contents of a specified key inside an encrypted `.env` file.

```sh
$ echo "HELLO=World\nHOLA=Mundo" > .env
$ dotenvx encrypt
◈ encrypted (.env)
$ dotenvx decrypt -k HELLO
◇ decrypted (.env)
```

Even specify a glob pattern.

```sh
$ echo "HELLO=World\nHOLA=Mundo" > .env
$ dotenvx encrypt
◈ encrypted (.env)
$ dotenvx decrypt -k "HE*"
◇ decrypted (.env)
```

</details>
<details><summary>`decrypt -ek`</summary><br>

Decrypt the contents inside an encrypted `.env` file except for an excluded key.

```sh
$ echo "HELLO=World\nHOLA=Mundo" > .env
$ dotenvx encrypt
◈ encrypted (.env)
$ dotenvx decrypt -ek HOLA
◇ decrypted (.env)
```

Even specify a glob pattern.

```sh
$ echo "HELLO=World\nHOLA=Mundo" > .env
$ dotenvx encrypt
◈ encrypted (.env)
$ dotenvx decrypt -ek "HO*"
◇ decrypted (.env)
```

</details>
<details><summary>`decrypt --stdout`</summary><br>

Decrypt the contents of an encrypted `.env` file and send to stdout.

```sh
$ dotenvx decrypt --stdout
#/-------------------[DOTENV_PUBLIC_KEY]--------------------/
#/            public-key encryption for .env files          /
#/       [how it works](https://dotenvx.com/encryption)     /
#/----------------------------------------------------------/
DOTENV_PUBLIC_KEY="034af93e93708b994c10f236c96ef88e47291066946cce2e8d98c9e02c741ced45"
# .env
HELLO="World"
```

or send to a file:

```sh
$ dotenvx decrypt --stdout > somefile.txt
```

</details>
<details><summary>`decrypt --stdout --mask`</summary><br>

Decrypt the contents of an encrypted `.env` file to stdout with its values masked. The encrypted `.env` file remains unchanged.

```sh
$ echo "SECRET=abcdefghijkl" > .env
$ dotenvx encrypt
◈ encrypted (.env)

$ dotenvx decrypt --stdout --mask
...
SECRET="abcdef******"
```

Pass a number to control how many characters are visible, such as `--mask 0` to fully mask values.

</details>
<details><summary>`keypair`</summary><br>

Print public/private keys for `.env` file.

```sh
$ echo "HELLO=World" > .env
$ dotenvx encrypt

$ dotenvx keypair
{"DOTENV_PUBLIC_KEY":"<publicKey>","DOTENV_PRIVATE_KEY":"<privateKey>"}
```

</details>
<details><summary>`keypair --no-native`</summary><br>

Turn off OS secret store lookups for keypair.

```sh
$ dotenvx keypair --no-native
{"DOTENV_PUBLIC_KEY":"<publicKey>","DOTENV_PRIVATE_KEY":"<privateKey>"}
```

</details>
<details><summary>`keypair --no-armor`</summary><br>

Turn off [Dotenvx Armor ⛨](https://dotenvx.com/armor) features for keypair.

```sh
$ dotenvx keypair --no-armor
{"DOTENV_PUBLIC_KEY":"<publicKey>","DOTENV_PRIVATE_KEY":"<privateKey>"}
```

</details>
<details><summary>`keypair -f`</summary><br>

Print public/private keys for `.env.production` file.

```sh
$ echo "HELLO=Production" > .env.production
$ dotenvx encrypt -f .env.production

$ dotenvx keypair -f .env.production
{"DOTENV_PUBLIC_KEY_PRODUCTION":"<publicKey>","DOTENV_PRIVATE_KEY_PRODUCTION":"<privateKey>"}
```

</details>
<details><summary>`keypair -fk`</summary><br>

Specify path to `.env.keys`. This is useful for printing public/private keys for monorepos.

```sh
$ mkdir -p apps/app1
$ echo "HELLO=World" > apps/app1/.env
$ dotenvx encrypt -fk .env.keys -f apps/app1/.env

$ dotenvx keypair -fk .env.keys -f apps/app1/.env
{"DOTENV_PUBLIC_KEY":"<publicKey>","DOTENV_PRIVATE_KEY":"<privateKey>"}
```

</details>
<details><summary>`keypair DOTENV_PRIVATE_KEY`</summary><br>

Print specific keypair for `.env` file.

```sh
$ echo "HELLO=World" > .env
$ dotenvx encrypt

$ dotenvx keypair DOTENV_PRIVATE_KEY
<privateKey>
```

</details>
<details><summary>`keypair --format shell`</summary><br>

Print a shell formatted response of public/private keys.

```sh
$ echo "HELLO=World" > .env
$ dotenx encrypt

$ dotenvx keypair --format shell
DOTENV_PUBLIC_KEY=<publicKey> DOTENV_PRIVATE_KEY=<privateKey>
```

</details>
<details><summary>`keypair --format colon`</summary><br>

Return a colon-formatted keypair.

```sh
$ dotenvx keypair --format colon
DOTENV_PUBLIC_KEY:<publicKey> DOTENV_PRIVATE_KEY:<privateKey>
```

</details>
<details><summary>`keypair --format json`</summary><br>

Return a JSON-formatted keypair.

```sh
$ dotenvx keypair --format json
{"DOTENV_PUBLIC_KEY":"<publicKey>","DOTENV_PRIVATE_KEY":"<privateKey>"}
```

</details>
<details><summary>`keypair --pretty-print`</summary><br>

Make the JSON output more readable.

```sh
$ dotenvx keypair --pretty-print
{
  "DOTENV_PUBLIC_KEY": "<publicKey>",
  "DOTENV_PRIVATE_KEY": "<privateKey>"
}
```

</details>
<details><summary>`ls`</summary><br>

Print all `.env` files in a tree structure.

```sh
$ touch .env
$ touch .env.production
$ mkdir -p apps/backend
$ touch apps/backend/.env

$ dotenvx ls
├─ .env.production
├─ .env
└─ apps
   └─ backend
      └─ .env
```

</details>
<details><summary>`ls directory`</summary><br>

Print all `.env` files inside a specified path to a directory.

```sh
$ touch .env
$ touch .env.production
$ mkdir -p apps/backend
$ touch apps/backend/.env

$ dotenvx ls apps/backend
└─ .env
```

</details>
<details><summary>`ls -f`</summary><br>

Glob `.env` filenames matching a wildcard.

```sh
$ touch .env
$ touch .env.production
$ mkdir -p apps/backend
$ touch apps/backend/.env
$ touch apps/backend/.env.prod

$ dotenvx ls -f **/.env.prod*
├─ .env.production
└─ apps
   └─ backend
      └─ .env.prod
```

</details>
<details><summary>`ls -ef`</summary><br>

Glob `.env` filenames excluding a wildcard.

```sh
$ touch .env
$ touch .env.production
$ mkdir -p apps/backend
$ touch apps/backend/.env
$ touch apps/backend/.env.prod

$ dotenvx ls -ef '**/.env.prod*'
├─ .env
└─ apps
   └─ backend
      └─ .env
```

</details>
<details><summary>`ls --json`</summary><br>

Print all matching `.env` files as a JSON array of absolute filepaths. Progress and summary details are written to stderr, so stdout can be safely piped to another command or file.

```sh
$ dotenvx ls --json
[
  "/path/to/project/.env",
  "/path/to/project/apps/backend/.env"
]

$ dotenvx ls --json > dotenv-files.json
```

</details>
<details><summary>`validate`</summary><br>

Validate `.env` file(s) against `.env.example` without running a command.

```ini
# .env.example
DATABASE_URL=
API_KEY=
SENTRY_DSN= # optional
```

```sh
$ dotenvx validate
[VALIDATION_FAILED] missing required (DATABASE_URL, API_KEY). fix: [https://github.com/dotenvx/dotenvx/issues/907]
```

Use `-f` and `-fk` to validate a specific env file and keys file. The command exits with code `1` when validation fails and prints errors to stderr. On success, it exits with code `0`.

```sh
$ dotenvx validate -f .env.production -fk .env.keys
```

</details>
<details><summary>`validate --ignore`</summary><br>

Ignore specific validation error codes.

```sh
$ dotenvx validate --ignore=MISSING_ENV_EXAMPLE
```

Ignore multiple error codes by separating them with spaces.

```sh
$ dotenvx validate --ignore=MISSING_ENV_FILE MISSING_ENV_EXAMPLE
```

You can also set `DOTENV_CONFIG_IGNORE`. Its value is a comma-separated list.

```sh
$ DOTENV_CONFIG_IGNORE=MISSING_ENV_FILE,OTHER dotenvx validate
```

</details>
<details><summary>`genexample`</summary><br>

In one command, generate a `.env.example` file from your current `.env` file contents.

```sh
$ echo "HELLO=World" > .env

$ dotenvx genexample
▣ generated (.env.example)
```

```ini
# .env.example
HELLO=""
```

</details>
<details><summary>`genexample -f`</summary><br>

Pass multiple `.env` files to generate your `.env.example` file from the combination of their contents.

```sh
$ echo "HELLO=World" > .env
$ echo "DB_HOST=example.com" > .env.production

$ dotenvx genexample -f .env -f .env.production
▣ generated (.env.example)
```

```ini
# .env.example
HELLO=""
DB_HOST=""
```

</details>
<details><summary>`genexample directory`</summary><br>

Generate a `.env.example` file inside the specified directory. Useful for monorepos.

```sh
$ echo "HELLO=World" > .env
$ mkdir -p apps/backend
$ echo "HELLO=Backend" > apps/backend/.env

$ dotenvx genexample apps/backend
▣ generated (.env.example)
```

```ini
# apps/backend/.env.example
HELLO=""
```

</details>
<details><summary>`gitignore`</summary><br>

Gitignore your `.env` files.

```sh
$ dotenvx gitignore
▣ ignored .env* (.gitignore)
```

</details>
<details><summary>`gitignore --pattern`</summary><br>

Gitignore specific pattern(s) of `.env` files.

```sh
$ dotenvx gitignore --pattern .env.keys
▣ ignored .env.keys (.gitignore)
```

</details>
<details><summary>`precommit`</summary><br>

Prevent `.env` files from being committed to code.

```sh
$ dotenvx precommit
▣ .env files (1) protected (encrypted or gitignored)
```

</details>
<details><summary>`precommit --install`</summary><br>

Install a shell script to `.git/hooks/pre-commit` to prevent accidentally committing any `.env` files to source control.

```sh
$ dotenvx precommit --install
▣ dotenvx precommit installed [.git/hooks/pre-commit]
```

</details>
<details><summary>`precommit directory`</summary><br>

Prevent `.env` files from being committed to code inside a specified path to a directory.

```sh
$ echo "HELLO=World" > .env
$ mkdir -p apps/backend
$ echo "HELLO=Backend" > apps/backend/.env

$ dotenvx precommit apps/backend
▣ apps/backend/.env not protected (encrypted or gitignored)
```

</details>
<details><summary>`prebuild`</summary><br>

Prevent `.env` files from being built into your docker containers.

Add it to your `Dockerfile`.

```Containerfile
# Install via script
RUN curl -fsS https://dotenvx.sh | sh

# Or copy binary from official image
COPY --from=dotenv/dotenvx:latest /usr/local/bin/dotenvx /bin/local/bin

# ... orther container commands

RUN dotenvx prebuild
CMD ["/usr/local/bin/dotenvx", "run", "--", "node", "index.js"]
```

</details>
<details><summary>`prebuild directory`</summary><br>

Prevent `.env` files from being built into your docker containers inside a specified path to a directory.

Add it to your `Dockerfile`.

```Containerfile
# Install via script
RUN curl -fsS https://dotenvx.sh | sh

# Or copy binary from official image
COPY --from=dotenv/dotenvx:latest /usr/local/bin/dotenvx /bin/local/bin

# ... orther container commands

RUN dotenvx prebuild apps/backend
CMD ["/usr/local/bin/dotenvx", "run", "--", "node", "apps/backend/index.js"]
```

</details>
<details><summary>`lock`</summary><br>

Lock private keys with a local passphrase to keep them protected inside `.env.keys`.

```
# example
DOTENV_PRIVATE_KEY=locked:02f5b97ad58b49ae324cd4e7937bc19b251d006b31cacf46f789eeaf03f923cedc:AZIPDxKqjPLiGl5b4CqVGbR3CIBDUcqHthGaoeWLoUvxbTHJkj3jGoGWGaxFSDUJGQUmWDaExRzxKpVydYF_7qiWr1ecqksOFho5t3EMwKbqX2-y-LZO9K3a4SJaYAjDJXpn3NwG4vAt1oLmGA
```

</details>
<details><summary>`lock up`</summary><br>

Lock a private key in `.env.keys` with a local passphrase.

```sh
$ dotenvx lock up
```

Here's what a locked key looks like:

```ini
# .env.keys
DOTENV_PRIVATE_KEY=locked:02f5b97ad58b49ae324cd4e7937bc19b251d006b31cacf46f789eeaf03f923cedc:AZIPDxKqjPLiGl5b4CqVGbR3CIBDUcqHthGaoeWLoUvxbTHJkj3jGoGWGaxFSDUJGQUmWDaExRzxKpVydYF_7qiWr1ecqksOFho5t3EMwKbqX2-y-LZO9K3a4SJaYAjDJXpn3NwG4vAt1oLmGA
```

Specify files with `-f` and `-fk`.

```sh
$ dotenvx lock up -f .env.production -fk .env.keys
```

</details>
<details><summary>`lock down`</summary><br>

Unlock a private key in `.env.keys` with its local passphrase.

```sh
$ dotenvx lock down
```

</details>
<details><summary>`native`</summary><br>

Move private keys into your OS secret store.

Native commands support macOS Keychain, Linux Secret Service, and Windows Credential Manager.

On Linux, `secret-tool` and an available Secret Service are required.

</details>
<details><summary>`native up`</summary><br>

Move a private key from `.env.keys` into your OS secret store.

```sh
$ dotenvx native up
```

Specify files with `-f` and `-fk`.

```sh
$ dotenvx native up -f .env.production -fk .env.keys
```

</details>
<details><summary>`native down`</summary><br>

Move a private key from your OS secret store back into `.env.keys`.

```sh
$ dotenvx native down
```

</details>
<details><summary>`native push`</summary><br>

Copy a private key from `.env.keys` into your OS secret store.

```sh
$ dotenvx native push
```

</details>
<details><summary>`native pull`</summary><br>

Copy a private key from your OS secret store into `.env.keys`.

```sh
$ dotenvx native pull
```

</details>
<details><summary>`armor`</summary><br>

Move private keys into [Dotenvx Armor ⛨](https://dotenvx.com/armor) for off-device storage, sharing with your team, and audited access.

</details>
<details><summary>`armor up`</summary><br>

Move a private key from `.env.keys` into Dotenvx Armor.

```sh
$ dotenvx armor login
$ dotenvx armor up
```

Specify environment and team.

```sh
$ dotenvx armor up -f .env.production --team acme
```

</details>
<details><summary>`armor down`</summary><br>

Move a private key from Dotenvx Armor back into `.env.keys`.

```sh
$ dotenvx armor down
```

</details>
<details><summary>`armor push`</summary><br>

Copy a private key from `.env.keys` into Dotenvx Armor.

```sh
$ dotenvx armor push
```

</details>
<details><summary>`armor pull`</summary><br>

Copy a private key from Dotenvx Armor into `.env.keys`.

```sh
$ dotenvx armor pull
```

Use a token when running non-interactively.

```sh
$ dotenvx armor pull -f .env.production --token "$DOTENVX_ARMOR_TOKEN"
```

</details>
<details><summary>`armor open`</summary><br>

Open an armored key in your browser.

```sh
$ dotenvx armor open
```

Open the armored key for a specific env file.

```sh
$ dotenvx armor open -f .env.production
```

</details>
<details><summary>`armor move`</summary><br>

Move an armored key to another team.

```sh
$ dotenvx armor move --team acme
```

</details>
<details><summary>`armor login`</summary><br>

Log in to Dotenvx Armor.

```sh
$ dotenvx armor login
```

After authentication, dotenvx first attempts to store your access token in your operating system's native secret store: macOS Keychain, Windows Credential Manager, or Linux Secret Service. If native secure storage is unavailable, dotenvx falls back to its settings file. This follows a common CLI credential-storage pattern: prefer protected OS storage when available while remaining usable in headless or minimal environments.

</details>
<details><summary>`armor logout`</summary><br>

Log out of Dotenvx Armor.

```sh
$ dotenvx armor logout
```

</details>
<details><summary>`armor status`</summary><br>

Print the current Armor status. It returns `on` when you are logged in and Armor is enabled; otherwise it returns `off`.

```sh
$ dotenvx armor status
on
```

</details>
<details><summary>`armor settings`</summary><br>

Inspect and manage your local Armor settings.

```sh
$ dotenvx armor settings username
$ dotenvx armor settings token
$ dotenvx armor settings device
$ dotenvx armor settings hostname
$ dotenvx armor settings path
$ dotenvx armor settings on
$ dotenvx armor settings off
```

Access tokens and device public keys are masked by default. Reveal the complete value only when you explicitly need it.

```sh
$ dotenvx armor settings token --unmask
$ dotenvx armor settings device --unmask
```

</details>
<details><summary>`help`</summary><br>

Output help for `dotenvx`.

```sh
$ dotenvx help
Usage: dotenvx run -- yourcommand

a secure dotenv–from the creator of `dotenv`

Options:
  -l, --log-level <level>      set log level (default: "info")
  -q, --quiet                  sets log level to error
  -v, --verbose                sets log level to verbose
  -d, --debug                  sets log level to debug
  -V, --version                output the version number
  -h, --help                   display help for command

Commands:
  run                inject env at runtime [dotenvx run -- yourcommand]
  get [KEY]          return a single environment variable
  set <KEY> <value>  set a single environment variable
  encrypt            encrypt .env file(s)
  decrypt            decrypt .env file(s)
  keypair [KEY]      print public/private keys for .env file(s)
  ls [directory]     print all .env files in a tree structure
  gitignore          append to .gitignore
  genexample [directory]
                     generate .env.example
  validate           validate .env file(s) against .env.example
  precommit [directory]
                     prevent committing .env files to code
  prebuild [directory]
                     prevent including .env files in docker
 
Professional Security: 
  lock                     ⊡ lock private keys with a local passphrase
  native                   ⌥ move private keys into your OS secret store
  armor                    ⛨ move private keys into Dotenvx Armor [www.dotenvx.com/armor]
```

You can get more detailed help per command with `dotenvx help COMMAND`.

```sh
$ dotenvx help run
Usage: @dotenvx/dotenvx run [options]

inject env at runtime [dotenvx run -- yourcommand]

Options:
  -e, --env <strings...>            environment variable(s) set as string (example: "HELLO=World") (default: [])
  -f, --env-file <paths...>         path(s) to your env file(s) (default: [])
  -fv, --env-vault-file <paths...>  path(s) to your .env.vault file(s) (default: [])
  -o, --overload                    override existing env variables
  --convention <name>               load a .env convention (available conventions: ['nextjs'])
  -h, --help                        display help for command

Examples:

  $ dotenvx run -- npm run dev
  $ dotenvx run -- flask --app index run
  $ dotenvx run -- php artisan serve
  $ dotenvx run -- bin/rails s

Try it:

  $ echo "HELLO=World" > .env
  $ echo "console.log('Hello ' + process.env.HELLO)" > index.js

  $ dotenvx run -- node index.js
  [dotenvx@1.X.X] injecting env (1) from .env
  Hello World
```

</details>
<details><summary>`--version`</summary><br>

Check current version of `dotenvx`.

```sh
$ dotenvx --version
X.X.X
```

</details>

&nbsp;

### Library 📦

Use dotenvx directly in code.

<details><summary>`config()`</summary><br>

Use directly in node.js code.

```ini
# .env
HELLO="World"
```

```js
// index.js
require('@dotenvx/dotenvx').config()

console.log(`Hello ${process.env.HELLO}`)
```

```sh
$ node index.js
[dotenvx@1.X.X] injecting env (1) from .env
Hello World
```

It defaults to looking for a `.env` file.

</details>
<details><summary>`config(mask: true)` - mask</summary><br>

Inject and return masked values. By default, up to the first six characters are visible.

```ini
# .env
SECRET="abcdefghijkl"
```

```js
// index.js
const dotenvx = require('@dotenvx/dotenvx')
const result = dotenvx.config({ mask: true, quiet: true })

console.log(process.env.SECRET)
console.log(result.parsed.SECRET)
```

```sh
$ node index.js
abcdef******
abcdef******
```

Set `mask: 0` to fully mask values.

</details>
<details><summary>`config(path: ['.env.local', '.env'])` - multiple files</summary><br>

Specify path(s) to multiple .env files.

```ini
# .env.local
HELLO="Me"
```

```ini
# .env
HELLO="World"
```

```js
// index.js
require('@dotenvx/dotenvx').config({path: ['.env.local', '.env']})

// esm
// import dotenvx from "@dotenvx/dotenvx";
// dotenvx.config({path: ['.env.local', '.env']});

console.log(`Hello ${process.env.HELLO}`)
```

```sh
$ node index.js
[dotenvx@1.X.X] injecting env (1) from .env.local, .env
Hello Me
```

</details>
<details><summary>`config(overload: true)` - overload</summary><br>

Use `overload` to overwrite the prior set value.

```ini
# .env.local
HELLO="Me"
```

```ini
# .env
HELLO="World"
```

```js
// index.js
require('@dotenvx/dotenvx').config({path: ['.env.local', '.env'], overload: true})

// esm
// import dotenvx from "@dotenvx/dotenvx";
// dotenvx.config({path: ['.env.local', '.env'], overload: true});

console.log(`Hello ${process.env.HELLO}`)
```

```sh
$ node index.js
[dotenvx@1.X.X] injecting env (1) from .env.local, .env
Hello World
```

</details>
<details><summary>`config(quiet: true)` - quiet</summary><br>

Suppress all output (except errors).

```ini
# .env
HELLO="World"
```

```js
// index.js
require('@dotenvx/dotenvx').config({path: ['.env.missing', '.env'], quiet: true})

// esm
// import dotenvx from "@dotenvx/dotenvx";
// dotenvx.config({path: ['.env.missing', '.env'], quiet: true});

console.log(`Hello ${process.env.HELLO}`)
```

```sh
$ node index.js
Error: [MISSING_ENV_FILE] missing .env.missing file (/path/to/.env.missing)
Hello World
```

You can also set `DOTENV_CONFIG_QUIET=true`.

```sh
$ DOTENV_CONFIG_QUIET=true node index.js
Error: [MISSING_ENV_FILE] missing .env.missing file (/path/to/.env.missing)
Hello World
```

</details>
<details><summary>`config(strict: true)` - strict</summary><br>

Exit with code `1` if any errors are encountered - like a missing .env file or decryption failure.

```ini
# .env
HELLO="World"
```

```js
// index.js
require('@dotenvx/dotenvx').config({path: ['.env.missing', '.env'], strict: true})

// esm
// import dotenvx from "@dotenvx/dotenvx";
// dotenvx.config({path: ['.env.missing', '.env'], strict: true});

console.log(`Hello ${process.env.HELLO}`)
```

```sh
$ node index.js
Error: [MISSING_ENV_FILE] missing .env.missing file (/path/to/.env.missing)
```

</details>
<details><summary>`config(ignore:)` - ignore</summary><br>

Use `ignore` to suppress specific errors like `MISSING_ENV_FILE`.

```ini
# .env
HELLO="World"
```

```js
// index.js
require('@dotenvx/dotenvx').config({path: ['.env.missing', '.env'], ignore: ['MISSING_ENV_FILE']})

// esm
// import dotenvx from "@dotenvx/dotenvx";
// dotenvx.config({path: ['.env.missing', '.env'], ignore: ['MISSING_ENV_FILE']});

console.log(`Hello ${process.env.HELLO}`)
```

```sh
$ node index.js
[dotenvx@1.X.X] injecting env (1) from .env
Hello World
```

</details>
<details><summary>`config(envKeysFile:)` - envKeysFile</summary><br>

Use `envKeysFile` to customize the path to your `.env.keys` file. This is useful with monorepos.

```ini
# .env
HELLO="World"
```

```js
// index.js
require('@dotenvx/dotenvx').config({path: ['.env'], envKeysFile: '../../.env.keys'})
```

</details>
<details><summary>`config(convention:)` - convention</summary><br>

Set a convention when using `dotenvx.config()`. This allows you to use the same file loading order as the CLI without needing to specify each file individually.

```sh
# Setup environment files
$ echo "HELLO=development local" > .env.development.local
$ echo "HELLO=local" > .env.local
$ echo "HELLO=development" > .env.development
$ echo "HELLO=env" > .env
```

```js
// index.js
require('@dotenvx/dotenvx').config({ convention: 'nextjs' })

console.log(`Hello ${process.env.HELLO}`)
```

```sh
$ NODE_ENV=development node index.js
[dotenvx@1.28.0] injecting env (1) from .env.development.local, .env.local, .env.development, .env
Hello development local
```

This is equivalent to using `--convention=nextjs` with the CLI:

```sh
$ dotenvx run --convention=nextjs -- node index.js
```

You can also set `DOTENV_CONFIG_CONVENTION=nextjs`.

```sh
$ DOTENV_CONFIG_CONVENTION=nextjs node index.js
```

</details>
<details><summary>`config(path: directory, convention: 'nextjs')` - directory</summary><br>

Use a directory as `path` to make it the base for convention files. This is useful when loading a workspace's env files from a monorepo root.

```js
// index.js
require('@dotenvx/dotenvx').config({
  path: 'apps/web',
  convention: 'nextjs'
})
```

This loads the convention from `apps/web`:

```text
apps/web/.env.development.local
apps/web/.env.local
apps/web/.env.development
apps/web/.env
```

</details>
<details><summary>`config(noArmor:)` - noArmor</summary><br>

Turn off [Dotenvx Armor ⛨](https://dotenvx.com/armor) features.

```js
// index.js
require('@dotenvx/dotenvx').config({noArmor: true})
```

</details>
<details><summary>`config(no1Password:)` - no1Password</summary><br>

By default, `config()` automatically resolves `op://` values through the installed [1Password CLI](https://developer.1password.com/docs/cli/get-started/).

```ini
# .env
API_KEY=op://Personal/my_api_key/password
```

```js
// index.js
require('@dotenvx/dotenvx').config()

console.log(process.env.API_KEY)
```

Set `no1Password` to leave `op://` values unresolved and avoid calling `op`.

```js
// index.js
require('@dotenvx/dotenvx').config({no1Password: true})
```

</details>
<details><summary>`config(noBitwarden:)` - noBitwarden</summary><br>

By default, `config()` automatically resolves `bw://` values through the installed [Bitwarden Password Manager CLI](https://bitwarden.com/help/cli/).

```ini
# .env
API_KEY="bw://My GitHub Account/password"
```

```js
// index.js
require('@dotenvx/dotenvx').config()

console.log(process.env.API_KEY)
```

Set `noBitwarden` to leave `bw://` values unresolved and avoid calling `bw`.

```js
// index.js
require('@dotenvx/dotenvx').config({noBitwarden: true})
```

</details>
<details><summary>`parse(src)`</summary><br>

Parse a `.env` string directly in node.js code.

```js
// index.js
const dotenvx = require('@dotenvx/dotenvx')
const src = 'HELLO=World'
const parsed = dotenvx.parse(src)
console.log(`Hello ${parsed.HELLO}`)
```

```sh
$ node index.js
Hello World
```

</details>
<details><summary>`parse(src, {processEnv:})`</summary><br>

Sometimes, you want to run `parse` without it accessing `process.env`. (You can pass a fake processEnv this way as well - sometimes useful.)

```js
// index.js
const dotenvx = require('@dotenvx/dotenvx')
const src = 'USER=Me'
const parsed = dotenvx.parse(src, { processEnv: {} })
console.log(`Hello ${parsed.USER}`)
```

```sh
$ node index.js
Hello Me
```

</details>
<details><summary>`parse(src, {privateKey:})`</summary><br>

Decrypt an encrypted `.env` string with `privateKey`.

```js
// index.js
const dotenvx = require('@dotenvx/dotenvx')
const src = 'HELLO="encrypted:BEiK4SwVe4rznIrZKW7qcnEBxo6Qxy0gv8xXiPN90N1jjhwkyVqzgoszZEI00tEeRWHsfQyJbCVy11qOEkkmERWbvOBzHve8/7WmVwyo5Z3HIOhlI45C+zmFgqmS2zMw9GPzHd9e"'
const parsed = dotenvx.parse(src, { privateKey: 'a4547dcd9d3429615a3649bb79e87edb62ee6a74b007075e9141ae44f5fb412c' })
console.log(`Hello ${parsed.HELLO}`)
```

```sh
$ node index.js
Hello World
```
</details>
<details><summary>`set(KEY, value)`</summary><br>

Programmatically set an environment variable. 

```js
// index.js
const dotenvx = require('@dotenvx/dotenvx')
dotenvx.set('HELLO', 'World', { path: '.env' })
```

</details>
<details><summary>`set(KEY, value, {plain:})`</summary><br>

Programmatically set a plaintext environment variable.

```js
// index.js
const dotenvx = require('@dotenvx/dotenvx')
dotenvx.set('HELLO', 'World', { plain: true })
```

</details>
<details><summary>`get(KEY)` - <i>Decryption at Access</i></summary><br>

Programmatically get an environment variable at access/runtime.

```js
// index.js
const dotenvx = require('@dotenvx/dotenvx')
const decryptedValue = await dotenvx.get('HELLO')
console.log(decryptedValue)
```

This is known as *Decryption at Access* and is written about in [the whitepaper](https://dotenvx.com/dotenvx.pdf).

</details>
<details><summary>`get(KEY, {mask:})`</summary><br>

Programmatically return a masked environment variable value.

```js
// index.js
const dotenvx = require('@dotenvx/dotenvx')
const maskedValue = await dotenvx.get('SECRET', { mask: true })
console.log(maskedValue)
```

```sh
$ node index.js
abcdef******
```

Set `mask: 0` to fully mask values.

</details>

&nbsp;

### More

<details><summary>Settings ⚙️</summary><br>

There are global settings available that can be configured as environment variables.

```ini
# config
DOTENV_CONFIG_CONVENTION= # set to a default convention like 'nextjs' or 'flow'
DOTENV_CONFIG_IGNORE= # MISSING_ENV_FILE,OTHER
DOTENV_CONFIG_QUIET= # set to "true" to default to --quiet

# armor
DOTENVX_ARMOR_TOKEN= # for api calls
DOTENVX_NO_ARMOR= # set to "true" to turn off Armor support

# 1password
DOTENVX_NO_1PASSWORD= # set to "true" to turn off 1Password support

# bitwarden
DOTENVX_NO_BITWARDEN= # set to "true" to turn off Bitwarden support
BW_SESSION= # set to bitwarden session token to bypass password prompt
```

</details>
<details><summary>Error Codes 🚨</summary><br>

Dotenvx errors begin with a stable code in square brackets like `[MISSING_ENV_FILE]`.

```ini
# error codes
1PASSWORD_FAILED= # a value could not be resolved with the 1Password CLI
ACCESS_APPROVAL_TIMEOUT= # an Armor access-approval request timed out
BITWARDEN_FAILED= # a value could not be resolved with the Bitwarden CLI
COMMAND_EXITED_WITH_CODE= # the command run by dotenvx exited with a non-zero status
COMMAND_SUBSTITUTION_FAILED= # a $(command) expression in an environment value could not be evaluated
DECRYPTION_FAILED= # an encrypted value could not be decrypted
FILE_NOT_WRITABLE= # dotenvx could not write to the target file
INVALID_COLOR= # the requested terminal color is invalid
INVALID_CONVENTION= # the requested environment-file convention is invalid
INVALID_PASSPHRASE= # a locked private key could not be unlocked with the supplied passphrase
INVALID_PRIVATE_KEY= # a private key is malformed or otherwise invalid
INVALID_PUBLIC_KEY= # a public key is malformed or otherwise invalid
MALFORMED_ENCRYPTED_DATA= # the encrypted value is malformed
MISPAIRED_PRIVATE_KEY= # a private key does not match the existing public key
MISSING_DIRECTORY= # the requested directory does not exist
MISSING_ENV_EXAMPLE= # the required .env.example file does not exist
MISSING_ENV_FILE= # a requested environment file does not exist
MISSING_ENV_FILES= # no .env* files were found
MISSING_ENV_KEYS_FILE= # the requested .env.keys file does not exist
MISSING_KEY= # a requested environment key does not exist
MISSING_LOG_LEVEL= # the requested log level is not supported
MISSING_PRIVATE_KEY= # the private key required to decrypt a value is missing
MISSING_PUBLIC_KEY= # the public key required to encrypt a value is missing
MISSING_REQUIRED= # validation detail for which required variables are missing; surfaced by VALIDATION_FAILED
MISSING_VALUE= # no value was supplied for a key
NOT_FOUND= # a private key was not found in the native secret store
PRECOMMIT_HOOK_MODIFY_FAILED= # dotenvx could not update the pre-commit hook
VALIDATION_FAILED= # one or more required variables declared by .env.example are missing
WRONG_PRIVATE_KEY= # the supplied private key cannot decrypt the value
```

</details>

&nbsp;

## Armor ⛨

[![dotenvx-armor](https://dotenvx.com/dotenvx-armor-banner.png?v2)](https://dotenvx.com/armor)

```
⛨ ARMORED KEYS: Harden your private keys.
⮕ install [curl -sfS https://dotenvx.sh/armor | sh]
⮕ then run [dotenvx armor login]
```

[Learn more](https://dotenvx.com/armor)

&nbsp;

## Quickstarts

> Encrypt and run secrets in your language, framework, or tool.
>

* [Claude](https://dotenvx.com/docs/secrets-in-claude)
* [Codex](https://dotenvx.com/docs/secrets-in-codex)
* [1Password](https://dotenvx.com/docs/secrets-in-1password)
* [Bitwarden](https://dotenvx.com/docs/secrets-in-bitwarden)
* [Node.js](https://dotenvx.com/docs/secrets-in-nodejs)
* [Next.js](https://dotenvx.com/docs/secrets-in-nextjs)
* [Express](https://dotenvx.com/docs/secrets-in-express)
* [Astro](https://dotenvx.com/docs/secrets-in-astro)
* [Expo](https://dotenvx.com/docs/secrets-in-expo)
* [Python](https://dotenvx.com/docs/secrets-in-python)
* [Ruby](https://dotenvx.com/docs/secrets-in-ruby)
* [Go](https://dotenvx.com/docs/secrets-in-go)
* [PHP](https://dotenvx.com/docs/secrets-in-php)
* [Rust](https://dotenvx.com/docs/secrets-in-rust)

[Browse all quickstarts](https://dotenvx.com/docs)

&nbsp;

## FAQ

#### How does encryption work?

Dotenvx uses Elliptic Curve Integrated Encryption Scheme (ECIES) to encrypt each secret with a unique ephemeral key, while ensuring it can be decrypted using a long-term private key.

When you initialize encryption, a DOTENV_PUBLIC_KEY (encryption key) and DOTENV_PRIVATE_KEY (decryption key) are generated. The DOTENV_PUBLIC_KEY is used to encrypt secrets, and the DOTENV_PRIVATE_KEY is securely stored in your cloud secrets manager or .env.keys file.

Your encrypted .env file is then safely committed to code. Even if the file is exposed, secrets remain protected since decryption requires the separate DOTENV_PRIVATE_KEY, which is never stored alongside it. Read [the whitepaper](https://dotenvx.com/dotenvx.pdf?v=README) for more details.

#### Is it safe to commit an encrypted .env file to code?

Yes. Dotenvx encrypts secrets using AES-256 with ephemeral keys, ensuring that even if the encrypted .env file is exposed, its contents remain secure. The encryption keys themselves are protected using Secp256k1 elliptic curve cryptography, which is widely used for secure key exchange in technologies like Bitcoin.

This means that every secret in the .env file is encrypted with a unique AES-256 key, and that key is further encrypted using a public key (Secp256k1). Even if an attacker obtains the encrypted .env file, they would still need the corresponding private key—stored separately in a secrets manager—to decrypt anything.

Breaking this encryption would require brute-forcing both AES-256 and elliptic curve cryptography, which is computationally infeasible with current technology. Read [the whitepaper](https://dotenvx.com/dotenvx.pdf?v=README) for more details.

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
