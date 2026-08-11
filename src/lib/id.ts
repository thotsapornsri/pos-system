let seq = 0;

/**
 * Unique id for a newly created record. A timestamp alone collides when two
 * records are created within the same millisecond, which duplicates React keys.
 */
export function uid(prefix: string): string {
  seq += 1;
  return `${prefix}${Date.now().toString(36)}${seq.toString(36)}`;
}
