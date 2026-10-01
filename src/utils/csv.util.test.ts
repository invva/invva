import assert from "node:assert/strict"
import { test } from "node:test"
import { toCsv } from "./csv.util.ts"

test("empty input gives an empty string", () => {
  assert.equal(toCsv([]), "")
})

test("quotes every field, doubles quotes, keeps commas and newlines inside the field", () => {
  const csv = toCsv([{ name: 'Bolt "M8", zinc', notes: "line1\nline2" }])
  assert.equal(csv, '"name","notes"\r\n"Bolt ""M8"", zinc","line1\nline2"')
})

test("neutralises formula injection in strings", () => {
  const csv = toCsv([{ a: '=HYPERLINK("http://evil")', b: "+1", c: "-2+3", d: "@SUM(A1)", e: "\tx" }])
  const row = csv.split("\r\n")[1]
  for (const cell of ["\"'=HYPERLINK", '"\'+1"', '"\'-2+3"', '"\'@SUM(A1)"', '"\'\tx"']) {
    assert.ok(row.includes(cell), `${cell} not found in ${row}`)
  }
})

test("numbers (including negatives), null and undefined are not altered", () => {
  assert.equal(
    toCsv([{ qty: -5, price: 10.5, note: null, other: undefined }]),
    '"qty","price","note","other"\r\n"-5","10.5",,'
  )
})

test("ordinary text is untouched", () => {
  assert.equal(toCsv([{ name: "Widget" }]), '"name"\r\n"Widget"')
})
