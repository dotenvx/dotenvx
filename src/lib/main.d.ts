import type { URL } from 'url';

export interface DotenvParseOutput {
  [name: string]: string;
}

/**
 * Parses a string or buffer in the .env file format into an object.
 *
 * @see https://dotenvx.com/docs
 * @param src - contents to be parsed. example: `'DB_HOST=localhost'`
 * @returns an object with keys and values based on `src`. example: `{ DB_HOST : 'localhost' }`
 */
export function parse<T extends DotenvParseOutput = DotenvParseOutput>(
  src: string | Buffer
): T;

export interface DotenvConfigOptions {
  /**   *
   * Specify a custom path if your file containing environment variables is located elsewhere.
   * Can also be an array of strings, specifying multiple paths.
   *
   * @default require('path').resolve(process.cwd(), '.env')
   * @example require('@dotenvx/dotenvx').config({ path: '/custom/path/to/.env' })
   * @example require('@dotenvx/dotenvx').config({ path: ['/path/to/first.env', '/path/to/second.env'] })
   */
  path?: string | string[] | URL;

  /**
   * Specify the encoding of your file containing environment variables.
   *
   * @default 'utf8'
   * @example require('@dotenvx/dotenvx').config({ encoding: 'latin1' })
   */
  encoding?: string;

  /**
   * Override any environment variables that have already been set on your machine with values from your .env file.
   * @default false
   * @example require('@dotenvx/dotenvx').config({ override: true })
   * @alias overload
   */
  override?: boolean;

  /**
   * @default false
   * @alias override
   */
  overload?: boolean;

  /**
   * Specify an object to write your secrets to. Defaults to process.env environment variables.
   *
   * @default process.env
   * @example const processEnv = {}; require('@dotenvx/dotenvx').config({ processEnv: processEnv })
   */
  processEnv?: DotenvPopulateInput;

  /**
   * Pass the DOTENV_KEY directly to config options. Defaults to looking for process.env.DOTENV_KEY environment variable. Note this only applies to decrypting .env.vault files. If passed as null or undefined, or not passed at all, dotenv falls back to its traditional job of parsing a .env file.
   *
   * @default undefined
   * @example require('@dotenvx/dotenvx').config({ DOTENV_KEY: 'dotenv://:key_1234…@dotenvx.com/vault/.env.vault?environment=production' })
   */
  DOTENV_KEY?: string;

  /**
   * Load a .env convention (available conventions: 'nextjs')
   */
  convention?: string;

  /**
   * Turn on logging to help debug why certain keys or values are not being set as you expect.
   *
   * @default false
   * @example require('@dotenvx/dotenvx').config({ debug: process.env.DEBUG })
   */
  debug?: boolean;

  verbose?: boolean;

  quiet?: boolean;

  logLevel?:
    | 'error'
    | 'errorv'
    | 'errorvp'
    | 'errorvpb'
    | 'errornocolor'
    | 'warn'
    | 'warnv'
    | 'warnvp'
    | 'warnvpb'
    | 'success'
    | 'successv'
    | 'successvp'
    | 'successvpb'
    | 'info'
    | 'help'
    | 'help2'
    | 'http'
    | 'verbose'
    | 'debug'
    | 'blank';
}

export interface DotenvConfigOutput {
  error?: Error;
  parsed?: DotenvParseOutput;
}

export interface DotenvPopulateInput {
  [name: string]: string;
}

/**
 * Loads `.env` file contents into process.env by default. If `DOTENV_KEY` is present, it smartly attempts to load encrypted `.env.vault` file contents into process.env.
 *
 * @see https://dotenvx.com/docs
 *
 * @param options - additional options. example: `{ path: './custom/path', encoding: 'latin1', debug: true, override: false }`
 * @returns an object with a `parsed` key if successful or `error` key if an error occurred. example: { parsed: { KEY: 'value' } }
 *
 */
export function config(options?: DotenvConfigOptions): DotenvConfigOutput;

/**
 * Loads `.env` file contents into process.env.
 *
 * @see https://dotenvx.com/docs
 *
 * @param options - additional options. example: `{ path: './custom/path', encoding: 'latin1', debug: true, override: false }`
 * @returns an object with a `parsed` key if successful or `error` key if an error occurred. example: { parsed: { KEY: 'value' } }
 *
 */
export function configDotenv(options?: DotenvConfigOptions): DotenvConfigOutput;

/**
 * Decrypt ciphertext
 *
 * @see https://dotenvx.com/docs
 *
 * @param envFile - the encrypted ciphertext string
 * @param key - the decryption key(s)
 */
export function decrypt(
  envFile?: string | string[],
  key?: string | string[]
): string;

export type EncryptRowOutput = {
  keys: string[];
  filepath: string;
  envFilepath: string;
  publicKey: string;
  privateKey: string;
  privateKeyName: string;
  privateKeyAdded: boolean;
  envSrc: string;
  changed: boolean;
  error?: Error;
};

export type EncryptOutput = {
  processedEnvFiles: EncryptRowOutput[];
  changedFilepaths: string[];
  unchangedFilepaths: string[];
};

/**
 * Encrypt plaintext
 *
 * @see https://dotenvx.com/docs
 * @param envFile - path to the .env file(s)
 * @param key - keys(s) to encrypt env file(s) (default: all keys in .env file)
 */
export function encrypt(
  envFile?: string | string[],
  key?: string | string[]
): EncryptOutput;

/**
 * List all env files in the current working directory
 *
 * @param directory - current working directory
 * @param envFile - glob pattern to match env files
 * @param excludeEnvFile - glob pattern to exclude env files
 */
export function ls(
  directory: string,
  envFile: string | string[],
  excludeEnvFile: string | string[]
): string[];

/**
 * Get the value of a key from the .env file
 *
 * @param [key] - the key to get the value of
 * @param [envs] - the environment(s) to get the value from
 * @param [overload] - whether to overload the value from the .env file
 * @param [DOTENV_KEY] - the decryption key string
 * @param [all] - whether to return all values
 */
export function get(
  key?: string,
  envs?: string[],
  overload?: boolean,
  DOTENV_KEY?: string,
  all?: boolean
): Record<string, string | undefined> | string | undefined;

export type SetOutput = {
  key: string;
  value: string;
  filepath: string;
  envFilepath: string;
  envSrc: string;
  changed: boolean;
  encryptedValue?: string;
  publicKey?: string;
  privateKey?: string;
  privateKeyAdded?: boolean;
  privateKeyName?: string;
  error?: Error;
};

/**
 * Set the value of a key in the .env file
 *
 * @param key - the key to set the value of
 * @param value - the value to set
 * @param envFile - the path to the .env file
 * @param [encrypt] - whether to encrypt the value
 */
export function set(
  key: string,
  value: string,
  envFile: string | string,
  encrypt?: boolean
): EncryptOutput;

export type GenExampleOutput = {
  envExampleFile: string;
  envFile: string | string[];
  exampleFilepath: string;
  addedKeys: string[];
  injected: Record<string, string>;
  preExisted: Record<string, string>;
};

/**
 * Generate an example .env file
 *
 * @param directory - current working directory
 * @param envFile - path to the .env file(s)
 */
export function genexample(
  directory: string,
  envFile: string
): GenExampleOutput;
