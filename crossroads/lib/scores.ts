/** Remove duplicate entries that share the same option name (first wins).
 *  The model occasionally lists the same option twice; without this, React
 *  renders duplicate keys and warns about unsupported behavior. */
export function dedupeByOption<T extends { option: string }>(scores: T[]): T[] {
  const seen = new Set<string>();
  return scores.filter((s) => {
    if (seen.has(s.option)) return false;
    seen.add(s.option);
    return true;
  });
}
