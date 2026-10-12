import { accounts, calculate, expectedInterest, kinds, validateTx } from "./engine";
import type { Account, REBook, REJournal, RETx } from "./engine";
export type RECell = string | number | boolean | null | undefined | { formula: string; result?: string | number | boolean | null };
export interface RESheet { name: string; rows: RECell[][] }
export const disclaimer = "Independent simulation using synthetic data. Any real company names are used for illustration only. No affiliation or endorsement is implied.";
const fields = ["id", "entityId", "kind", "amount", "date", "reference", "description", "investorId", "propertyId", "loanId", "targetEntityId", "debit", "credit", "reason", "evidence"] as const;
export async function readTransactionFile(file: File, book: REBook) {
  if (file.size > 2 * 1024 * 1024) throw new Error("File limit is 2 MB.");
  if (!file.name.toLowerCase().endsWith(".xlsx")) return parseTransactions(await file.text(), file.name.toLowerCase(), book);
  // Read bounded OOXML ZIP members without executing formulas, macros or external links.
  const bytes = new Uint8Array(await file.arrayBuffer()); const view = new DataView(bytes.buffer); const decoder = new TextDecoder();
  let end = -1;
  for (let p = bytes.length - 22; p >= Math.max(0, bytes.length - 65557); p--) if (view.getUint32(p, true) === 0x06054b50) { end = p; break; }
  if (end < 0) throw new Error("Invalid XLSX archive.");
  const count = view.getUint16(end + 10, true); if (count > 200) throw new Error("Workbook has too many archive members.");
  let cursor = view.getUint32(end + 16, true); let totalSize = 0;
  const entries = new Map<string, { method: number; compressed: number; size: number; offset: number }>();
  for (let i = 0; i < count; i++) {
    if (view.getUint32(cursor, true) !== 0x02014b50) throw new Error("Invalid XLSX directory.");
    const length = view.getUint16(cursor + 28, true); const name = decoder.decode(bytes.subarray(cursor + 46, cursor + 46 + length));
    const entry = { method: view.getUint16(cursor + 10, true), compressed: view.getUint32(cursor + 20, true), size: view.getUint32(cursor + 24, true), offset: view.getUint32(cursor + 42, true) };
    if (name.includes("..") || name.startsWith("/") || view.getUint16(cursor + 8, true) & 1) throw new Error("Unsafe/encrypted workbook is not supported.");
    totalSize += entry.size; if (totalSize > 10 * 1024 * 1024) throw new Error("Expanded workbook exceeds 10 MB.");
    entries.set(name, entry); cursor += 46 + length + view.getUint16(cursor + 30, true) + view.getUint16(cursor + 32, true);
  }
  const read = async (name: string) => {
    const entry = entries.get(name); if (!entry) throw new Error(`Missing workbook member ${name}.`);
    const at = entry.offset; if (view.getUint32(at, true) !== 0x04034b50) throw new Error("Invalid XLSX member.");
    const start = at + 30 + view.getUint16(at + 26, true) + view.getUint16(at + 28, true);
    const data = bytes.slice(start, start + entry.compressed); let decoded = data;
    if (entry.method === 8) {
      if (typeof DecompressionStream === "undefined") throw new Error("This browser cannot decompress XLSX. Use CSV instead.");
      const reader = new Blob([data]).stream().pipeThrough(new DecompressionStream("deflate-raw")).getReader(); const chunks: Uint8Array[] = []; let size = 0;
      while (true) { const item = await reader.read(); if (item.done) break; size += item.value.length; if (size > entry.size || size > 10 * 1024 * 1024) { await reader.cancel(); throw new Error("Workbook expansion limit exceeded."); } chunks.push(item.value); }
      decoded = new Uint8Array(size); let offset = 0; for (const chunk of chunks) { decoded.set(chunk, offset); offset += chunk.length; }
    } else if (entry.method !== 0) throw new Error("Unsupported XLSX compression. Use CSV.");
    if (decoded.length !== entry.size) throw new Error("Workbook member length mismatch.");
    const xml = new DOMParser().parseFromString(decoder.decode(decoded), "application/xml"); if (xml.getElementsByTagName("parsererror").length) throw new Error("Invalid workbook XML."); return xml;
  };
  const workbook = await read("xl/workbook.xml"); const relations = await read("xl/_rels/workbook.xml.rels");
  const sheetNodes = Array.from(workbook.getElementsByTagName("sheet")); const selected = sheetNodes.find(s => s.getAttribute("name") === "Transactions") ?? sheetNodes[0];
  if (!selected) throw new Error("No worksheet found.");
  const relation = Array.from(relations.getElementsByTagName("Relationship")).find(r => r.getAttribute("Id") === selected.getAttribute("r:id"));
  if (!relation || relation.getAttribute("TargetMode") === "External") throw new Error("Invalid/external worksheet reference.");
  const target = relation.getAttribute("Target") ?? ""; const path = target.startsWith("/xl/") ? target.slice(1) : `xl/${target}`;
  const xml = await read(path);
  const shared = entries.has("xl/sharedStrings.xml") ? Array.from((await read("xl/sharedStrings.xml")).getElementsByTagName("si")).map(s => s.textContent ?? "") : [];
  const rows = Array.from(xml.getElementsByTagName("row")).map(row => {
    const values: string[] = [];
    for (const cell of Array.from(row.getElementsByTagName("c"))) {
      if (cell.getElementsByTagName("f").length) throw new Error("Transaction import rejects formula cells. Paste values before upload.");
      const ref = cell.getAttribute("r") ?? ""; let index = 0; for (const letter of ref.replace(/\d/g, "")) index = index * 26 + letter.charCodeAt(0) - 64;
      const value = cell.getElementsByTagName("v")[0]?.textContent ?? "";
      values[index - 1] = cell.getAttribute("t") === "s" ? shared[Number(value)] ?? "" : cell.getAttribute("t") === "inlineStr" ? cell.getElementsByTagName("is")[0]?.textContent ?? "" : value;
    }
    return values;
  });
  const headerIndex = rows.findIndex(row => fields.every(f => row.includes(f))); if (headerIndex < 0) throw new Error("Transaction template headers not found.");
  return parseTransactions(csv(rows.slice(headerIndex)), "transactions.csv", book);
}
export function downloadText(name: string, text: string, type = "text/plain") {
  const url = URL.createObjectURL(new Blob([text], { type })); const a = document.createElement("a"); a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url);
}
export function csv(rows: unknown[][]) { return rows.map(row => row.map(v => { let text = String(v ?? ""); if (/^[=+@]/.test(text) || /^-\D/.test(text)) text = "'" + text; return `"${text.replaceAll('"', '""')}"`; }).join(",")).join("\r\n"); }
export function transactionCsv(txs: RETx[]) { return csv([Array.from(fields), ...txs.map(t => fields.map(f => f === "amount" ? t.amount / 100 : t[f]))]); }
function parseCsv(text: string): string[][] {
  const rows: string[][] = []; let row: string[] = []; let field = ""; let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') { if (quoted && text[i + 1] === '"') { field += '"'; i++; } else quoted = !quoted; }
    else if (!quoted && (c === "," || c === "\n" || c === "\r")) { row.push(field); field = ""; if (c !== ",") { if (row.some(Boolean)) rows.push(row); row = []; if (c === "\r" && text[i + 1] === "\n") i++; } }
    else field += c;
  }
  if (quoted) throw new Error("Unterminated quoted CSV field.");
  row.push(field); if (row.some(Boolean)) rows.push(row); return rows;
}
export function parseTransactions(text: string, filename: string, book: REBook) {
  let rows: Record<string, unknown>[];
  if (filename.endsWith(".json")) { const value = JSON.parse(text); if (!Array.isArray(value)) throw new Error("JSON must be an array of transaction records."); rows = value; }
  else if (filename.endsWith(".csv")) { const parsed = parseCsv(text.replace(/^\uFEFF/, "")); const headers = parsed.shift() ?? []; if (!fields.every(f => headers.includes(f))) throw new Error("Use the supplied transaction template headers."); rows = parsed.map(row => Object.fromEntries(headers.map((h, i) => [h, row[i]]))); }
  else throw new Error("Use the workbook reader for XLSX archives; raw binary is not a CSV/JSON transaction stream.");
  if (rows.length > 1000) throw new Error("Maximum 1,000 rows per import.");
  const seen = new Set(book.transactions.map(t => t.id));
  const errors: string[] = []; const transactions: RETx[] = [];
  for (const [i, row] of rows.entries()) {
    if (!row || typeof row !== "object") { errors.push(`Row ${i + 1}: invalid record`); continue; }
    const tx = Object.fromEntries(fields.map(f => [f, String(row[f] ?? "").trim()])) as unknown as RETx;
    tx.amount = Math.round(Number(row.amount) * 100); tx.status = "Draft"; tx.maker = "import.demo";
    for (const key of ["investorId", "propertyId", "loanId", "targetEntityId", "debit", "credit"] as const) if (!tx[key]) delete tx[key];
    const issues = [...validateTx(book, tx)];
    if (Math.abs(Number(row.amount) * 100 - tx.amount) > .000001) issues.push("Amount must use no more than two decimal places.");
    if (!tx.id || tx.id.length > 100 || seen.has(tx.id)) issues.push("Missing or duplicate source ID.");
    if (!kinds.includes(tx.kind)) issues.push("Unknown transaction type.");
    if ((tx.debit && !Object.hasOwn(accounts, tx.debit)) || (tx.credit && !Object.hasOwn(accounts, tx.credit))) issues.push("Invalid chart-of-accounts code.");
    if (issues.length) errors.push(`Row ${i + 1} (${tx.id}): ${issues.join(" ")}`); else { transactions.push(tx); seen.add(tx.id); }
  }
  return { transactions, errors };
}
const sheet = (name: string, headers: string[], rows: RECell[][]): RESheet => ({ name, rows: [[name], [disclaimer], ["Currency", "USD unless stated", "Amounts", "major currency units"], headers, ...rows] });
export function buildREPack(book: REBook): RESheet[] {
  const r = calculate(book); const sheets: RESheet[] = [];
  sheets.push(sheet("Entities", ["ID", "Name", "Currency", "Parent", "Ownership", "Closing FX"], book.entities.map(e => [e.id, e.name, e.currency, e.parent, e.ownership, book.fx[e.currency]])));
  sheets.push(sheet("Journals", ["Journal", "Source", "Entity", "Account", "Signed Local Amount", "Historical FX", "Signed Historical USD", "Closing FX", "Signed Closing USD", "Category", "Investor"], book.journals.flatMap((j: REJournal) => j.lines.map(l => [j.id, j.sourceId, l.entityId, l.account, l.amount / 100, j.rate, 0, 0, 0, accounts[l.account], l.investorId ?? ""]))));
  for (let i = 4; i < sheets[1].rows.length; i++) { const n = i + 1; const row = sheets[1].rows[i]; row[6] = { formula: `ROUND(E${n}*F${n},2)`, result: Math.round(Number(row[4]) * Number(row[5]) * 100) / 100 }; row[7] = { formula: `SUMIF(Entities!A5:A${book.entities.length + 4},C${n},Entities!F5:F${book.entities.length + 4})`, result: book.fx[book.entities.find(e => e.id === row[2])!.currency] }; row[8] = { formula: `ROUND(E${n}*H${n},2)`, result: Math.round(Number(row[4]) * Number((row[7] as {result:number}).result) * 100) / 100 }; }
  const last = sheets[1].rows.length; const local = `Journals!E5:E${last}`; const base = `Journals!I5:I${last}`; const category = `Journals!J5:J${last}`; const account = `Journals!D5:D${last}`; const entity = `Journals!C5:C${last}`; const historical = `Journals!G5:G${last}`;
  sheets.push(sheet("Trial_Balance", ["Entity", "Account", "Currency", "Debit", "Credit", "Signed USD"], r.tb.map(t => [t.entityId, t.account, t.currency, { formula: `MAX(0,SUMIFS(${local},${entity},A${r.tb.indexOf(t) + 5},${account},B${r.tb.indexOf(t) + 5}))`, result: t.debit / 100 }, { formula: `MAX(0,-SUMIFS(${local},${entity},A${r.tb.indexOf(t) + 5},${account},B${r.tb.indexOf(t) + 5}))`, result: t.credit / 100 }, { formula: `SUMIFS(${base},${entity},A${r.tb.indexOf(t) + 5},${account},B${r.tb.indexOf(t) + 5})`, result: t.base / 100 }])));
  const navRows: RECell[][] = [
    ["Gross assets", { formula: `SUMIF(${category},"Asset",${base})`, result: r.assets / 100 + (r.investmentElimination + r.intercompanyAsset) / 100 }],
    ["Investment elimination", { formula: `SUMIFS(${base},${account},"Investment",${entity},"FUND")`, result: r.investmentElimination / 100 }],
    ["Intercompany asset elimination", { formula: `SUMIF(${account},"IntercompanyReceivable",${base})`, result: r.intercompanyAsset / 100 }],
    ["Consolidated assets", { formula: "B5-B6-B7", result: r.assets / 100 }],
    ["Gross liabilities", { formula: `-SUMIF(${category},"Liability",${base})`, result: (r.liabilities + r.intercompanyLiability) / 100 }],
    ["Intercompany liability elimination", { formula: `-SUMIF(${account},"IntercompanyPayable",${base})`, result: r.intercompanyLiability / 100 }],
    ["Consolidated liabilities", { formula: "B9-B10", result: r.liabilities / 100 }],
    ["NAV", { formula: "B8-B11", result: r.nav / 100 }],
    ["Period P&L", { formula: `-SUMIF(${category},"Income",${historical})-SUMIF(${category},"Expense",${historical})`, result: r.pnl / 100 }],
    ["Fund capital incl distributions", { formula: `-SUMIFS(${historical},${category},"Equity",${entity},"FUND")`, result: r.capital / 100 }],
    ["Translation reserve", { formula: "B12-B13-B14", result: r.translation / 100 }],
  ];
  sheets.push(sheet("NAV_Working", ["Metric", "USD"], navRows));
  sheets.push(sheet("Investor_Capital", ["ID", "Investor", "Opening", "Commitment", "Allocation", "Contributions", "Distributions", "P&L", "FX", "Closing"], r.investors.map((i, idx) => {
    const n = idx + 5; const previousEnd = n - 1; const lastInvestor = idx === r.investors.length - 1;
    return [i.id, i.name, i.openingCapital / 100, i.commitment / 100, { formula: `C${n}/SUM(C5:C${r.investors.length + 4})`, result: i.weight }, { formula: `-SUMIFS(${historical},Journals!K5:K${last},A${n},${account},"Capital")-C${n}`, result: i.contribution / 100 }, { formula: `SUMIFS(${historical},Journals!K5:K${last},A${n},${account},"Distributions")`, result: i.distribution / 100 }, { formula: lastInvestor ? `NAV_Working!B13-SUM(H5:H${previousEnd})` : `ROUND(E${n}*NAV_Working!B13,2)`, result: i.pnl / 100 }, { formula: lastInvestor ? `NAV_Working!B15-SUM(I5:I${previousEnd})` : `ROUND(E${n}*NAV_Working!B15,2)`, result: i.fx / 100 }, { formula: `C${n}+F${n}-G${n}+H${n}+I${n}`, result: i.closing / 100 }];
  })));
  sheets.push(sheet("Control_Checks", ["Check", "Residual", "Expected or source"], [["Investor capital to NAV", { formula: `NAV_Working!B12-SUM(Investor_Capital!J5:J${r.investors.length + 4})`, result: (r.nav - r.investors.reduce((s, i) => s + i.closing, 0)) / 100 }, 0], ["Intercompany", { formula: "NAV_Working!B7-NAV_Working!B10", result: (r.intercompanyAsset - r.intercompanyLiability) / 100 }, 0], ...r.controls.map(c => [c.name, c.residual / 100, c.source])]));
  sheets.push(sheet("Property_Register", ["ID", "Entity", "Property", "Sector", "Cost local", "Approved valuation local", "Date", "Evidence approved"], book.properties.map(p => [p.id, p.entityId, p.name, p.sector, p.cost / 100, p.valuation / 100, p.valuationDate, p.approved])));
  sheets.push(sheet("Rent_Roll", ["Lease", "Property", "Tenant", "Monthly Rent local", "Start", "End"], book.leases.map(l => [l.id, l.propertyId, l.tenant, l.monthlyRent / 100, l.start, l.end])));
  sheets.push(sheet("Bank_Recon", ["Entity", "Ledger local", "Statement local", "Difference local"], r.bankRows.map((b, idx) => [b.entityId, { formula: `SUMIFS(${local},${entity},A${idx + 5},${account},"Cash")`, result: b.ledger / 100 }, b.external / 100, { formula: `B${idx + 5}-C${idx + 5}`, result: b.difference / 100 }])));
  sheets.push(sheet("Debt", ["Loan", "Entity", "Lender", "Opening principal local", "Annual rate", "Days", "Expected dated interest local", "Maturity"], book.loans.map(l => [l.id, l.entityId, l.lender, l.principal / 100, l.annualRate, l.days, expectedInterest(book, l) / 100, l.maturity])));
  sheets.push(sheet("Transactions", fields.map(String), book.transactions.map(t => fields.map(f => f === "amount" ? t.amount / 100 : t[f] as string))));
  sheets.push(sheet("Audit", ["ID", "Time", "Actor", "Action", "Record", "Old", "New", "Reason"], book.audit.map(a => [a.id, a.at, a.user, a.action, a.record, a.old, a.value, a.reason])));
  sheets.push(sheet("Policy", ["Policy", "Scope"], [["Model", "Consolidated, 100%-owned SPVs; IAS40 fair-value investment property"], ["Allocation", "Opening-capital weights, no intra-period equalization"], ["Capital calls", "Memorandum until contributions received"], ["Excel", "Edit journal inputs; formulas recalculate financial aggregates. Posted app workflow is not executed in Excel."], ["Limitations", "No NCI/JV, investment-entity FVTPL, tax, EIR, hedge accounting or locked-cell protection"], ["Security", "Local-browser demonstration, not production authentication or immutable audit"]]));
  return sheets;
}
