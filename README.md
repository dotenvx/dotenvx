![dotenvx](https://dotenvx.com/better-banner.png)

*a better dotenv*–from the creator of [`dotenv`](https://github.com/motdotla/dotenv).

* run anywhere (cross-platform)
* multi-environment
* encrypted envs

&nbsp;


### Quickstart

```sh
brew install dotenvx/brew/dotenvx
```
> * [other ways to install](https://dotenvx.com/docs/install)

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
  $ echo "HELLO=World" > .env && echo 'import os;print("Hello " + os.getenv("HELLO", ""))' > index.py

  $ dotenvx run -- python3 index.py
  Hello World
  ```

  </details>
* <details><summary>PHP 🐘</summary><br>

  ```sh
  $ echo "HELLO=World" > .env && echo '<?php echo "Hello {$_SERVER["HELLO"]}\n";' > index.php

  $ dotenvx run -- php index.php
  Hello World
  ```

  </details>
* <details><summary>Ruby 💎</summary><br>

  ```sh
  $ echo "HELLO=World" > .env && echo 'puts "Hello #{ENV["HELLO"]}"' > index.rb

  $ dotenvx run -- ruby index.rb
  Hello World
  ```

  </details>
* <details><summary>Go 🐹</summary><br>

  ```sh
  $ echo "HELLO=World" > .env && echo 'package main; import ("fmt"; "os"); func main() { fmt.Printf("Hello %s\n", os.Getenv("HELLO")) }' > main.go

  $ dotenvx run -- go run main.go
  Hello World
  ```

  </details>
* <details><summary>Rust 🦀</summary><br>

  ```sh
  $ echo "HELLO=World" > .env && echo 'fn main() {let hello = std::env::var("HELLO").unwrap_or("".to_string());println!("Hello {hello}");}' > src/main.rs

  $ dotenvx run -- cargo run
  Hello World
  ```

  </details>
* <details><summary>Java ☕️</summary><br>

  ```sh
  $ echo "HELLO=World" > .env && echo 'public class Index { public static void main(String[] args) { System.out.println("Hello " + System.getenv("HELLO")); } }' > index.java

  $ dotenvx run -- java index.java
  Hello World
  ```

  </details>
* <details><summary>.NET 🔵</summary><br>

  ```sh
  $ dotnet new console -n HelloWorld -o HelloWorld
  $ cd HelloWorld
  $ echo "HELLO=World" > .env && echo 'Console.WriteLine($"Hello {Environment.GetEnvironmentVariable("HELLO")}");' > Program.cs && echo "HELLO=World" > .env

  $ dotenvx run -- dotnet run
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
  $ docker run -it --rm -v $(pwd):/app dotenv/dotenvx run -- node index.js
  ```

  Or in any image:

  ```sh
  FROM node:latest
  RUN echo "HELLO=World" > .env && echo "console.log('Hello ' + process.env.HELLO)" > index.js
  RUN curl -fsS https://dotenvx.sh/ | sh
  CMD ["dotenvx", "run", "--", "echo", "Hello $HELLO"]
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

&nbsp;

## Multiple Environments

> Create a `.env.production` file and use `--env-file` to load it. It's straightforward, yet flexible.
```sh
$ echo "HELLO=production" > .env.production
$ echo "console.log('Hello ' + process.env.HELLO)" > index.js

$ dotenvx run --env-file=.env.production -- node index.js
[dotenvx][info] loading env (1) from .env.production
Hello production
> ^^
```

More examples

* <details><summary>multiple `.env` files</summary><br>

  ```sh
  $ echo "HELLO=local" > .env.local

  $ echo "HELLO=World" > .env

  $ dotenvx run --env-file=.env.local --env-file=.env -- node index.js
  [dotenvx][info] loading env (1) from .env.local,.env
  Hello local
  ```

  </details>

* <details><summary>`--overload` flag</summary><br>

  ```sh
  $ echo "HELLO=local" > .env.local

  $ echo "HELLO=World" > .env

  $ dotenvx run --env-file=.env.local --env-file=.env --overload -- node index.js
  [dotenvx][info] loading env (1) from .env.local,.env
  Hello World
  ```

* <details><summary>`--verbose` flag</summary><br>

  ```sh
  $ echo "HELLO=production" > .env.production

  $ dotenvx run --env-file=.env.production --verbose -- node index.js
  [dotenvx][verbose] injecting env from /path/to/.env.production
  [dotenvx][verbose] HELLO set
  [dotenvx][info] loading env (1) from .env.production
  Hello production
  ```

* <details><summary>`--debug` flag</summary><br>

  ```sh
  $ echo "HELLO=production" > .env.production

  $ dotenvx run --env-file=.env.production --debug -- node index.js
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

&nbsp;

## Encryption

> Encrypt your secrets to a `.env.vault` file and load your secrets in an encrypted manner from that – recommended for production and ci.
```sh
$ echo "HELLO=World" > .env && echo "console.log('Hello ' + process.env.HELLO)" > index.js

$ echo "HELLO=production" > .env.production

$ dotenvx encrypt
[dotenvx][info] encrypted to .env.vault (.env,.env.production)
[dotenvx][info] key added to .env.keys (DOTENV_KEY_PRODUCTION)

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

* <details><summary>Docker</summary><br>

  ```sh
  coming soon
  ```

  </details>


* <details><summary>Fly.io</summary><br>

  ```sh
  coming soon
  ```

  </details>

* <details><summary>Heroku</summary><br>

  ```sh
  coming soon
  ```

  </details>

* <details><summary>Laravel Forge</summary><br>

  ```sh
  coming soon
  ```

  </details>

* <details><summary>Netlify</summary><br>

  ```sh
  coming soon
  ```

  </details>

* <details><summary>Railway</summary><br>

  ```sh
  coming soon
  ```

  </details>

* <details><summary>Render</summary><br>

  ```sh
  coming soon
  ```

  </details>

* <details><summary>Vercel</summary><br>

  ```sh
  coming soon
  ```

  </details>

* <details><summary>CircleCI</summary><br>

  ```sh
  coming soon
  ```

  </details>

* <details><summary>GitHub Actions</summary><br>

  ```sh
  coming soon
  ```

  </details>

&nbsp;

## Guides

* [dotenvx/docs](https://dotenvx.com/docs)
* [quickstart guide](https://dotenvx.com/docs/quickstart)

## Contributing

You can fork this repo and create [pull requests](https://github.com/dotenvx/dotenvx/pulls) or if you have questions or feedback:

* [github.com/dotenvx/dotenvx](https://github.com/dotenvx/dotenvx/issues) - bugs and discussions
* [@dotenvx 𝕏](https://x.com/dotenvx) (DMs are open)
