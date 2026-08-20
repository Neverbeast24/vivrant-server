/** Parse pasted spreadsheet / notepad lists into row cells. */

const HEADER_RE =
  /^(name|item|title|grocery|meal|expense|qty|quantity|category|price|amount|#)$/i;

export function asNumber(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const n = Number(String(value).replace(/[₱$,]/g, "").trim());
  return Number.isFinite(n) ? n : undefined;
}

function splitCsv(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      quoted = !quoted;
      continue;
    }
    if (ch === "," && !quoted) {
      cells.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }
  cells.push(current.trim());
  return cells;
}

/** Turn a pasted block into rows of cells (tabs, commas, or one name per line). */
export function parseSpreadsheetPaste(text: string, maxRows = 40): string[][] {
  const lines = String(text ?? "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"));

  if (!lines.length) return [];

  const hasTab = lines.some((line) => line.includes("\t"));
  const commaLines = lines.filter((line) => line.includes(",")).length;
  const useComma = !hasTab && commaLines >= Math.ceil(lines.length / 2);

  const rows = lines
    .map((line) => {
      const raw = hasTab ? line.split("\t") : useComma ? splitCsv(line) : [line];
      return raw.map((cell) => cell.trim().replace(/^['"]|['"]$/g, ""));
    })
    .filter((cells) => Boolean(cells[0]));

  if (rows.length && HEADER_RE.test(rows[0][0] ?? "")) {
    rows.shift();
  }

  return rows.slice(0, maxRows);
}

export function mapTypedLine(
  cells: string[],
  knownCategories: Iterable<string>,
): { name: string; quantity?: string; category?: string; amount?: number } {
  const categories = new Set(
    [...knownCategories].map((value) => value.toLowerCase()),
  );
  const name = cells[0]?.trim() ?? "";
  let quantity: string | undefined;
  let category: string | undefined;
  let amount: number | undefined;

  for (const cell of cells.slice(1)) {
    if (!cell) continue;
    const lower = cell.toLowerCase();
    const numeric = asNumber(cell);
    const looksNumeric = /^-?\d/.test(cell.replace(/[₱$,\s]/g, ""));
    if (categories.has(lower)) {
      category = lower;
    } else if (looksNumeric && numeric != null) {
      amount = numeric;
    } else if (!quantity) {
      quantity = cell;
    }
  }

  return { name, quantity, category, amount };
}
