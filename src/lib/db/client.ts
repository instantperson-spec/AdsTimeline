import { neon } from '@neondatabase/serverless';

/** Tagged-template SQL client (array of row objects, default Neon mode). */
export type Sql = (
  strings: TemplateStringsArray,
  ...params: readonly unknown[]
) => Promise<Record<string, unknown>[]>;

let sqlInstance: Sql | null = null;

export function getSql(): Sql {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is not configured');
  }
  if (!sqlInstance) {
    sqlInstance = neon(url) as Sql;
  }
  return sqlInstance;
}

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}
