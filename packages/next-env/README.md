# @dotenvx/next-env

`@dotenvx/next-env` is a drop-in replacement for Next.js' `@next/env` package.

Use it when you want Next.js to load encrypted dotenvx files during Next's own environment-loading step. This lets decrypted values exist before Next.js evaluates server modules.

```json
{
  "dependencies": {
    "@dotenvx/next-env": "^1.74.0",
    "next": "^16.0.0"
  },
  "overrides": {
    "@next/env": "npm:@dotenvx/next-env"
  }
}
```

After installing, run Next.js normally:

```sh
npm run dev
npm run build
```
