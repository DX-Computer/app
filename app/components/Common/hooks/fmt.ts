export const fmt = (
  s: string,
  vars: Record<string, string | number>,
): string =>
  s.replace(/\{(\w+)\}/g, (_, k) => {
    const v = vars[k];
    return v === undefined ? "" : String(v);
  });
