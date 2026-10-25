import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
const source = ts.transpileModule(fs.readFileSync("src/components/mobileNavigation.ts", "utf8"), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const load = value => import("data:text/javascript;base64," + Buffer.from(source.replace("import.meta.env.VITE_MOBILE_WORKSPACE_V2", value)).toString("base64"));
const { searchAreas, mobileNavigationEnabled, recordLabel } = await load("undefined");
let count = 0;
const check = (name, test) => { test(); count++; console.log("PASS " + name); };
const areas = [
  { title: "Accounting & NAV", items: [{ id: "gl", label: "General Ledger" }, { id: "tb", label: "Trial Balance" }, { id: "nav", label: "NAV Package" }] },
  { title: "Reconciliation", items: [{ id: "cash", label: "Cash Reconciliation" }, { id: "positions", label: "Position Reconciliation" }] },
];
const snapshot = JSON.stringify(areas);
check("Empty search preserves the permitted navigation tree", () => assert.equal(searchAreas(areas, ""), areas));
check("Whitespace-only search preserves all permitted tabs", () => assert.equal(searchAreas(areas, "   "), areas));
check("Tab search ignores case", () => assert.deepEqual(searchAreas(areas, "tRiAl")[0].items.map(i => i.id), ["tb"]));
check("Section name search exposes its permitted tabs", () => assert.equal(searchAreas(areas, "Accounting")[0].items.length, 3));
check("Multiple words match section plus tab", () => assert.deepEqual(searchAreas(areas, "Accounting Trial")[0].items.map(i => i.id), ["tb"]));
check("Unknown search produces a real empty state", () => assert.deepEqual(searchAreas(areas, "unknown item"), []));
check("Partial words find operational tab names", () => assert.equal(searchAreas(areas, "recon pos")[0].items[0].id, "positions"));
check("Search never invents tabs hidden by Student visibility", () => assert.deepEqual(searchAreas(areas, "performance fee"), []));
check("Identifiers remain opaque and unchanged", () => assert.equal(searchAreas([{ title: "Area", items: [{ id: "a/b:2", label: "Record" }] }], "record")[0].items[0].id, "a/b:2"));
check("Search never mutates original navigation", () => assert.equal(JSON.stringify(areas), snapshot));
check("Mobile refinement is enabled by default", () => assert.equal(mobileNavigationEnabled, true));
const rollback = await load('"false"');
check("Build flag restores the previous mobile UI", () => assert.equal(rollback.mobileNavigationEnabled, false));
check("Cash break finds existing cash reconciliation", () => assert.equal(searchAreas(areas, "cash break")[0].items[0].id, "cash"));
check("Bank mismatch finds existing cash reconciliation", () => assert.equal(searchAreas(areas, "bank mismatch")[0].items[0].id, "cash"));
check("Journal entry finds General Ledger", () => assert.equal(searchAreas(areas, "journal entry")[0].items[0].id, "gl"));
check("Aliases never expose unavailable fee modules", () => assert.deepEqual(searchAreas(areas, "hwm"), []));
check("Record names identify entity, account and currency", () => assert.equal(recordLabel([{heading:"Entity",value:"FUND"},{heading:"Account",value:"Cash"},{heading:"Currency",value:"USD"}],0), "1. FUND / Cash / USD"));
check("Record names handle empty rows", () => assert.equal(recordLabel([],0), "1. Record"));
console.log(count + " mobile navigation checks passed.");
