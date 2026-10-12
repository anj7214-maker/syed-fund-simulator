import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";
const compile = async (path, replace = {}) => {
  let source = await readFile(new URL(path, import.meta.url), "utf8");
  for (const [from, to] of Object.entries(replace)) source = source.replaceAll(JSON.stringify(from), JSON.stringify(to));
  return "data:text/javascript;base64," + Buffer.from(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText).toString("base64");
};
const dataUrl = await compile("../src/data/sampleData.ts");
const reUrl = await compile("../src/realEstate/engine.ts");
const calcUrl = await compile("../src/engine/recalc.ts", { "../data/sampleData": dataUrl });
const demo = await import(await compile("../src/workspaces/homeDemo.ts", { "../data/sampleData": dataUrl, "../engine/recalc": calcUrl, "../realEstate/engine": reUrl }));
const samples = await import(dataUrl); const before = JSON.stringify(samples);
let tests = 0;
const test = (name, fn) => { fn(); tests++; console.log(`PASS ${name}`); };
for (const asset of ["hedge-fund", "real-estate"]) {
  for (const move of [-12, 0, 12]) test(`${asset} ${move}% has finite, linked, balanced values`, () => {
    const result = demo.getHomeDemo(asset, move);
    assert.ok(result.balanced);
    assert.equal(result.nodes.at(-1).after, result.afterNav);
    assert.ok(Math.abs(result.afterNav - result.beforeNav - result.impact) < .01);
    result.nodes.forEach(n => { assert.ok(Number.isFinite(n.before)); assert.ok(Number.isFinite(n.after)); });
    if (move === 0) { assert.equal(result.impact, 0); result.nodes.forEach(n => assert.equal(n.before, n.after)); }
    else assert.equal(Math.sign(result.impact), Math.sign(move));
  });
}
test("Hedge Fund mark uses source price and rounding", () => assert.equal(demo.getHomeDemo("hedge-fund", -12).nodes[0].after, 371.18));
test("Real Estate preview applies the actual 1.2m valuation loss", () => { const r = demo.getHomeDemo("real-estate", -12); assert.equal(r.beforeNav, 35010754.21); assert.equal(r.impact, -1200000); assert.equal(r.afterNav, 33810754.21); });
test("Synthetic inputs remain unchanged", () => assert.equal(JSON.stringify(samples), before));
test("Repeat calculations do not accumulate postings", () => assert.deepEqual(demo.getHomeDemo("real-estate", -8), demo.getHomeDemo("real-estate", -8)));
test("Out-of-range and non-finite movements are rejected", () => { for (const move of [NaN, Infinity, -Infinity, 13, -13]) assert.throws(() => demo.getHomeDemo("hedge-fund", move)); });
const source = await readFile(new URL("../src/workspaces/homeDemo.ts", import.meta.url), "utf8");
test("Home has no persistence or workspace store imports", () => assert.doesNotMatch(source, /localStorage|indexedDB|useFundStore|useREStore|setItem/));
console.log(`${tests} Home demo checks passed.`);
