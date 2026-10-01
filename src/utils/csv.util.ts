// Spreadsheets run text starting with = + - @ (or tab/CR) as a formula.
const FORMULA_START = /^[=+\-@\t\r]/

function escapeCell(value: unknown): string {
  if (value === null || value === undefined) return ""
  let text = String(value)
  // A leading ' makes the spreadsheet treat the cell as plain text. Numbers are safe, so only strings are checked.
  if (typeof value === "string" && FORMULA_START.test(text)) text = `'${text}`
  return `"${text.replace(/"/g, '""')}"`
}

/**
 * Convert rows to RFC 4180 CSV: every value quoted (null/undefined become an empty field), quotes doubled, formula-looking text neutralised.
 * Column order and headers come from the first row.
 */
export function toCsv<T extends Record<string, unknown>>(rows: T[]): string {
  if (rows.length === 0) return ""
  const headers = Object.keys(rows[0])
  return [headers, ...rows.map((row) => headers.map((header) => row[header]))]
    .map((line) => line.map(escapeCell).join(","))
    .join("\r\n")
}
