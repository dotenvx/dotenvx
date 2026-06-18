import type { NextConfig } from 'next';
import type { DotenvConfigOptions } from './main';

export interface DotenvxNextOptions {
  /**
   * Env files to load. Defaults to ['.env'].
   */
  files?: string[];

  /**
   * Alias for files that matches dotenvx.config({ path }).
   */
  path?: string | string[];

  /**
   * Directory where env files live. Defaults to process.cwd().
   */
  envDir?: string;

  /**
   * Additional options passed to dotenvx.config().
   */
  dotenvx?: DotenvConfigOptions;
}

export function withDotenvx(
  nextConfig?: NextConfig | ((phase: string, defaults: { defaultConfig: NextConfig }) => NextConfig | Promise<NextConfig>),
  options?: DotenvxNextOptions
): (phase: string, defaults: { defaultConfig: NextConfig }) => Promise<NextConfig>;
